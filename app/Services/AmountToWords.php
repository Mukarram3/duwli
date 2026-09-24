<?php

namespace App\Services;

/**
 * AMOUNT IN WORDS — English and Arabic
 * =============================================================================
 * A receipt voucher states the amount twice: as figures and as words. The words
 * are the legally controlling version precisely because they cannot be altered
 * by adding a digit, which is why every printed voucher in the region carries
 * them.
 *
 * Both languages are produced from the same number so they can never disagree.
 *
 * ARABIC IS NOT A TRANSLATION OF THE ENGLISH. It is generated natively, because
 * Arabic number words are grammatically different in ways a word-for-word
 * translation gets wrong:
 *
 *   - Units come BEFORE tens: ٢١ is "واحد وعشرون" (one and twenty)
 *   - 2 has a dual form: مئتان, ألفان — not "two hundred", "two thousand"
 *   - The counted noun changes with the count: ريال / ريالان / ريالات
 *
 * Halalas are rendered as a separate trailing clause rather than a decimal,
 * which is how a voucher reads them aloud.
 */
class AmountToWords
{
    private const EN_ONES = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen',
    ];

    private const EN_TENS = [
        '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    private const AR_ONES = [
        '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
        'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
        'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
    ];

    private const AR_TENS = [
        '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون',
    ];

    private const AR_HUNDREDS = [
        '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة',
        'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة',
    ];

    /**
     * @return array{en:string, ar:string}
     */
    public static function convert(float $amount, string $currency = 'SAR'): array
    {
        $amount  = round($amount, 2);
        $whole   = (int) floor($amount);
        // Built from the rounded string, not $amount - $whole: binary floats
        // turn 0.07 into 0.06999999 and the voucher would read "six halalas".
        $decimals = (int) round(($amount - $whole) * 100);

        [$majorEn, $minorEn] = self::currencyNamesEn($currency);

        $en = self::wordsEn($whole) . ' ' . $majorEn;
        if ($decimals > 0) {
            $en .= ' and ' . self::wordsEn($decimals) . ' ' . $minorEn;
        }
        $en .= ' Only';

        $ar = self::wordsAr($whole) . ' ' . self::currencyNameAr($currency, $whole);
        if ($decimals > 0) {
            $ar .= ' و' . self::wordsAr($decimals) . ' ' . self::minorNameAr($currency, $decimals);
        }
        $ar .= ' فقط لا غير';

        return ['en' => trim($en), 'ar' => trim($ar)];
    }

    // ── English ──────────────────────────────────────────────────────────

    private static function wordsEn(int $n): string
    {
        if ($n === 0) {
            return 'Zero';
        }

        $out = '';

        foreach ([1000000000 => 'Billion', 1000000 => 'Million', 1000 => 'Thousand'] as $unit => $name) {
            if ($n >= $unit) {
                $out .= self::wordsEn(intdiv($n, $unit)) . ' ' . $name . ' ';
                $n %= $unit;
            }
        }

        if ($n >= 100) {
            $out .= self::EN_ONES[intdiv($n, 100)] . ' Hundred ';
            $n %= 100;
        }

        if ($n >= 20) {
            $out .= self::EN_TENS[intdiv($n, 10)];
            $n %= 10;
            // Hyphenated, as "Twenty-One" is written on a document.
            $out .= $n > 0 ? '-' . self::EN_ONES[$n] : '';
        } elseif ($n > 0) {
            $out .= self::EN_ONES[$n];
        }

        return trim(preg_replace('/\s+/', ' ', $out));
    }

    // ── Arabic ───────────────────────────────────────────────────────────

    private static function wordsAr(int $n): string
    {
        if ($n === 0) {
            return 'صفر';
        }

        $parts = [];

        foreach ([
            1000000000 => ['مليار', 'ملياران', 'مليارات'],
            1000000    => ['مليون', 'مليونان', 'ملايين'],
            1000       => ['ألف',   'ألفان',   'آلاف'],
        ] as $unit => [$single, $dual, $plural]) {
            if ($n >= $unit) {
                $count = intdiv($n, $unit);
                $n %= $unit;

                // Arabic has a DUAL form: 2000 is "ألفان", not "اثنان ألف".
                if ($count === 1) {
                    $parts[] = $single;
                } elseif ($count === 2) {
                    $parts[] = $dual;
                } elseif ($count <= 10) {
                    $parts[] = self::wordsAr($count) . ' ' . $plural;
                } else {
                    $parts[] = self::wordsAr($count) . ' ' . $single;
                }
            }
        }

        if ($n >= 100) {
            $parts[] = self::AR_HUNDREDS[intdiv($n, 100)];
            $n %= 100;
        }

        if ($n >= 20) {
            $ones = $n % 10;
            $tens = self::AR_TENS[intdiv($n, 10)];
            // Units come BEFORE tens, joined with "و": ٢١ = واحد وعشرون
            $parts[] = $ones > 0 ? self::AR_ONES[$ones] . ' و' . $tens : $tens;
        } elseif ($n > 0) {
            $parts[] = self::AR_ONES[$n];
        }

        return implode(' و', array_filter($parts));
    }

    // ── Currency names ───────────────────────────────────────────────────

    private static function currencyNamesEn(string $currency): array
    {
        return match (strtoupper($currency)) {
            'SAR'   => ['Saudi Riyals', 'Halalas'],
            'AED'   => ['UAE Dirhams', 'Fils'],
            'USD'   => ['US Dollars', 'Cents'],
            'EUR'   => ['Euros', 'Cents'],
            'GBP'   => ['Pounds Sterling', 'Pence'],
            default => [strtoupper($currency), 'Cents'],
        };
    }

    /** The counted noun changes with the count — ريال / ريالان / ريالات. */
    private static function currencyNameAr(string $currency, int $count): string
    {
        $forms = match (strtoupper($currency)) {
            'SAR'   => ['ريال سعودي', 'ريالان سعوديان', 'ريالات سعودية'],
            'AED'   => ['درهم إماراتي', 'درهمان إماراتيان', 'دراهم إماراتية'],
            'USD'   => ['دولار أمريكي', 'دولاران أمريكيان', 'دولارات أمريكية'],
            default => [strtoupper($currency), strtoupper($currency), strtoupper($currency)],
        };

        if ($count === 1) return $forms[0];
        if ($count === 2) return $forms[1];
        if ($count >= 3 && $count <= 10) return $forms[2];

        return $forms[0];
    }

    private static function minorNameAr(string $currency, int $count): string
    {
        $forms = match (strtoupper($currency)) {
            'SAR'   => ['هللة', 'هللتان', 'هللات'],
            'AED'   => ['فلس', 'فلسان', 'فلوس'],
            default => ['سنت', 'سنتان', 'سنتات'],
        };

        if ($count === 1) return $forms[0];
        if ($count === 2) return $forms[1];
        if ($count >= 3 && $count <= 10) return $forms[2];

        return $forms[0];
    }
}
