<?php

namespace App\Services;

/**
 * VAT CALCULATOR
 * =============================================================================
 * One place that knows how a line and an invoice are costed. The form, the
 * store action, the posting action and the printed document all call this, so
 * a figure can never differ between the screen and the ledger.
 *
 * THE RULES IT ENCODES
 *
 * 1. DISCOUNT COMES OFF BEFORE VAT.
 *    VAT is charged on what the customer actually pays, not on the list price.
 *    Applying it the other way overstates the tax due on every discounted line.
 *
 * 2. INCLUSIVE AND EXCLUSIVE PRICES ARE DIFFERENT ARITHMETIC, per line.
 *
 *      exclusive:  net = qty × price − discount
 *                  vat = net × rate
 *
 *      inclusive:  gross = qty × price − discount
 *                  net   = gross ÷ (1 + rate)
 *                  vat   = gross − net
 *
 *    Treating an inclusive price as exclusive overcharges VAT by the rate
 *    squared — on 15% that is a 2.25% error on every affected line, which is
 *    small enough to survive a casual review and large enough to matter across
 *    a year.
 *
 * 3. ROUNDING HAPPENS PER LINE, THEN LINES ARE SUMMED.
 *    Rounding the invoice total instead lets it disagree with the sum of its
 *    own lines by a halala or two, which fails ZATCA validation and makes the
 *    printed document look wrong.
 *
 * 4. ZERO-RATED AND EXEMPT ARE NOT THE SAME THING.
 *    Both carry 0% VAT, so a rate alone cannot tell them apart. They are
 *    separated by CATEGORY CODE, which is why the tax master now stores one:
 *
 *      S  standard rate       Z  zero rated (taxable, 0%)
 *      E  exempt              O  outside scope
 *
 *    They must appear on separate lines of the VAT summary and are reported
 *    differently to the authority.
 */
class VatCalculator
{
    /** Halalas — Saudi currency has two decimal places. */
    private const SCALE = 2;

    /**
     * Cost a single invoice line.
     *
     * @param  array{quantity:float,unit_price:float,discount_percentage?:float,discount_amount?:float,tax_percentage?:float,is_tax_inclusive?:bool,tax_category_code?:string}  $line
     * @return array{gross:float,discount_amount:float,total_before_vat:float,tax_amount:float,total_amount:float,tax_category_code:string,tax_percentage:float}
     */
    public function line(array $line): array
    {
        $quantity  = (float) ($line['quantity'] ?? 0);
        $unitPrice = (float) ($line['unit_price'] ?? 0);
        $rate      = (float) ($line['tax_percentage'] ?? 0);
        $inclusive = (bool) ($line['is_tax_inclusive'] ?? false);
        $category  = $line['tax_category_code'] ?? ($rate > 0 ? 'S' : 'Z');

        $gross = $quantity * $unitPrice;

        /*
         * A percentage discount and a fixed discount are both supported. The
         * percentage wins when both are supplied, because it is the one the
         * user typed on a per-line basis; a fixed amount is normally an
         * invoice-level allocation.
         */
        if (!empty($line['discount_percentage'])) {
            $discount = $gross * ((float) $line['discount_percentage'] / 100);
        } else {
            $discount = (float) ($line['discount_amount'] ?? 0);
        }

        $discount = min($discount, $gross); // never discount below zero
        $afterDiscount = $gross - $discount;

        if ($inclusive && $rate > 0) {
            // The figure entered already contains VAT; extract it.
            $net = $afterDiscount / (1 + ($rate / 100));
            $vat = $afterDiscount - $net;
        } else {
            $net = $afterDiscount;
            $vat = $net * ($rate / 100);
        }

        // Categories Z, E and O carry no VAT whatever rate was entered. This
        // guards against a mis-keyed rate on an exempt line producing tax that
        // should not exist.
        if (in_array($category, ['Z', 'E', 'O'], true)) {
            $vat = 0.0;
        }

        $net = $this->round($net);
        $vat = $this->round($vat);

        return [
            'gross'                 => $this->round($gross),
            'discount_amount'       => $this->round($discount),
            'total_before_vat'      => $net,
            'tax_amount'            => $vat,
            'total_amount'          => $this->round($net + $vat),
            'tax_category_code'     => $category,
            'tax_percentage'        => $rate,
            'exemption_reason_code' => $line['exemption_reason_code'] ?? null,
        ];
    }

    /**
     * Cost a whole invoice from its lines.
     *
     * Returns both the totals and the VAT SUMMARY grouped by category, which
     * is what the summary block on the form and the printed document render,
     * and what ZATCA requires as `TaxSubtotal` entries.
     *
     * @param  array<int,array>  $lines
     */
    public function invoice(array $lines): array
    {
        $costed = [];
        $summary = [];

        $subtotal = 0.0;   // gross, before discount
        $discount = 0.0;
        $beforeVat = 0.0;
        $vat = 0.0;

        foreach ($lines as $index => $line) {
            $result = $this->line($line);
            $costed[$index] = $result;

            $subtotal  += $result['gross'];
            $discount  += $result['discount_amount'];
            $beforeVat += $result['total_before_vat'];
            $vat       += $result['tax_amount'];

            /*
             * Grouped by category AND rate. Two standard-rated lines at
             * different rates (a historic 5% alongside today's 15%) must not
             * be merged — the authority expects one subtotal per rate.
             */
            $key = $result['tax_category_code'] . '-' . $result['tax_percentage'];

            if (!isset($summary[$key])) {
                $summary[$key] = [
                    'category_code'         => $result['tax_category_code'],
                    'category_label'        => self::categoryLabel($result['tax_category_code']),
                    'rate'                  => $result['tax_percentage'],
                    'taxable_amount'        => 0.0,
                    'tax_amount'            => 0.0,
                    'exemption_reason_code' => $result['exemption_reason_code'],
                ];
            }

            $summary[$key]['taxable_amount'] += $result['total_before_vat'];
            $summary[$key]['tax_amount']     += $result['tax_amount'];
        }

        // Standard first, then zero, exempt, out of scope — the order a reader
        // expects and the order the printed summary uses.
        $order = ['S' => 0, 'Z' => 1, 'E' => 2, 'O' => 3];
        uasort($summary, function ($a, $b) use ($order) {
            $byCategory = ($order[$a['category_code']] ?? 9) <=> ($order[$b['category_code']] ?? 9);
            return $byCategory !== 0 ? $byCategory : ($b['rate'] <=> $a['rate']);
        });

        foreach ($summary as $key => $row) {
            $summary[$key]['taxable_amount'] = $this->round($row['taxable_amount']);
            $summary[$key]['tax_amount']     = $this->round($row['tax_amount']);
        }

        return [
            'lines'            => $costed,
            'subtotal'         => $this->round($subtotal),
            'discount_amount'  => $this->round($discount),
            'total_before_vat' => $this->round($beforeVat),
            'tax_amount'       => $this->round($vat),
            'total_amount'     => $this->round($beforeVat + $vat),
            'vat_summary'      => array_values($summary),
        ];
    }

    /** Human label for a category code. */
    public static function categoryLabel(string $code): string
    {
        return match ($code) {
            'S' => 'Standard Rate',
            'Z' => 'Zero Rated',
            'E' => 'Exempt from Tax',
            'O' => 'Outside Scope of Tax',
            default => $code,
        };
    }

    /** Every category the system recognises, for pickers and summaries. */
    public static function categories(): array
    {
        return [
            ['code' => 'S', 'label' => 'Standard Rate',        'requires_reason' => false],
            ['code' => 'Z', 'label' => 'Zero Rated',           'requires_reason' => true],
            ['code' => 'E', 'label' => 'Exempt from Tax',      'requires_reason' => true],
            ['code' => 'O', 'label' => 'Outside Scope of Tax', 'requires_reason' => true],
        ];
    }

    /**
     * Half-up, which is what invoices use. PHP's default for round() is
     * already half-up; it is stated explicitly here so nobody has to check.
     */
    private function round(float $value): float
    {
        return round($value, self::SCALE, PHP_ROUND_HALF_UP);
    }
}
