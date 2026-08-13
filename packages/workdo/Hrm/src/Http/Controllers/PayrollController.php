<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Models\Payroll;
use Workdo\Hrm\Http\Requests\StorePayrollRequest;
use Workdo\Hrm\Http\Requests\UpdatePayrollRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\Hrm\Models\Allowance;
use Workdo\Hrm\Models\AllowanceType;
use Workdo\Hrm\Models\Attendance;
use Workdo\Hrm\Models\Deduction;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\LeaveApplication;
use Workdo\Hrm\Models\Loan;
use Workdo\Hrm\Models\Overtime;
use Workdo\Hrm\Models\PayrollEntry;
use Workdo\Hrm\Events\CreatePayroll;
use Workdo\Hrm\Events\UpdatePayroll;
use Workdo\Hrm\Events\DestroyPayroll;
use Workdo\Hrm\Events\DestroySalarySlip;
use Workdo\Hrm\Events\PaySalary;

class PayrollController extends Controller
{
    private function checkPayrollAccess(Payroll $payroll)
    {
        if(Auth::user()->can('manage-any-payrolls')) {
            return $payroll->created_by == creatorId();
        } elseif(Auth::user()->can('manage-own-payrolls')) {
            return $payroll->creator_id == Auth::id();
        }
        return false;
    }
    public function index()
    {
        if (Auth::user()->can('manage-payrolls')) {
            $year = request('year', date('Y'));
            $month = request('month', date('n') - 1); // 0-indexed month (0 = Jan, 11 = Dec)

            $baseQuery = Payroll::query()
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-payrolls')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-payrolls')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(!checkDemo(), function ($q) use ($year, $month) {
                    $q->where(function ($q) use ($year, $month) {
                        $dbMonth = intval($month) + 1;
                        $q->whereYear('pay_period_start', $year)
                          ->whereMonth('pay_period_start', $dbMonth);
                    });
                });

            $totalPayrolls = (clone $baseQuery)->count();
            $draftCount = (clone $baseQuery)->where('status', 'draft')->count();
            $processingCount = (clone $baseQuery)->where('status', 'processing')->count();
            $completedCount = (clone $baseQuery)->where('status', 'completed')->count();
            $cancelledCount = (clone $baseQuery)->where('status', 'cancelled')->count();

            $stats = [
                'total' => $totalPayrolls,
                'draft' => $draftCount,
                'processing' => $processingCount,
                'completed' => $completedCount,
                'cancelled' => $cancelledCount,
            ];

            $payrolls = (clone $baseQuery)
                ->when(request('title'), function ($q) {
                    $q->where(function ($query) {
                        $query->where('title', 'like', '%' . request('title') . '%');
                    });
                })
                ->when(request('payroll_frequency') !== null && request('payroll_frequency') !== '', fn($q) => $q->where('payroll_frequency', request('payroll_frequency')))
                ->when(request('status') !== null && request('status') !== '', fn($q) => $q->where('status', request('status')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Hrm/Payrolls/Index', [
                'payrolls' => $payrolls,
                'stats' => $stats,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StorePayrollRequest $request)
    {
        if (Auth::user()->can('create-payrolls')) {
            $validated = $request->validated();
            $payroll = new Payroll();
            $payroll->title = $validated['title'];
            $payroll->payroll_frequency = $validated['payroll_frequency'];
            $payroll->pay_period_start = $validated['pay_period_start'];
            $payroll->pay_period_end = $validated['pay_period_end'];
            $payroll->pay_date = $validated['pay_date'];
            $payroll->notes = $validated['notes'];

            $payroll->creator_id = Auth::id();
            $payroll->created_by = creatorId();
            $payroll->save();

            CreatePayroll::dispatch($request, $payroll);

            return redirect()->route('hrm.payrolls.index')->with('success', __('The payroll has been created successfully.'));
        } else {
            return redirect()->route('hrm.payrolls.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdatePayrollRequest $request, Payroll $payroll)
    {
        if (Auth::user()->can('edit-payrolls')) {
            $validated = $request->validated();
            $payroll->title = $validated['title'];
            $payroll->payroll_frequency = $validated['payroll_frequency'];
            $payroll->pay_period_start = $validated['pay_period_start'];
            $payroll->pay_period_end = $validated['pay_period_end'];
            $payroll->pay_date = $validated['pay_date'];
            $payroll->notes = $validated['notes'];
            $payroll->status = $validated['status'];
            $payroll->is_payroll_paid = $validated['is_payroll_paid'] ?? 'unpaid';
            $payroll->save();

            UpdatePayroll::dispatch($request, $payroll);

            return redirect()->back()->with('success', __('The payroll details are updated successfully.'));
        } else {
            return redirect()->route('hrm.payrolls.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Payroll $payroll)
    {
        if (Auth::user()->can('view-payrolls')) {
            if(!$this->checkPayrollAccess($payroll)) {
                return redirect()->route('hrm.payrolls.index')->with('error', __('Permission denied'));
            }
            $payroll->load(['payrollEntries' => function ($query) {
                if (Auth::user()->can('view-any-payrolls')) {
                    $query->with(['employee.user:id,name,email,avatar'])->where('created_by', creatorId());
                } elseif (Auth::user()->can('view-own-payrolls')) {
                    $query->with(['employee.user:id,name,email,avatar'])->where('employee_id', Auth::id());
                } else {
                    $query->whereRaw('1 = 0');
                }
            }]);

            return Inertia::render('Hrm/Payrolls/Show', [
                'payroll' => $payroll,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(Payroll $payroll)
    {
        if (Auth::user()->can('delete-payrolls')) {
            DestroyPayroll::dispatch($payroll);
            $payroll->delete();

            return redirect()->back()->with('success', __('The payroll has been deleted.'));
        } else {
            return redirect()->route('hrm.payrolls.index')->with('error', __('Permission denied'));
        }
    }

    public function runPayroll(Payroll $payroll)
    {
        if (Auth::user()->can('run-payrolls')) {

            try {
                $payroll->update(['status' => 'processing']);

                // Get working days from settings
                $globalSettings = getCompanyAllSetting();
                $workingDaysIndices = json_decode($globalSettings['working_days'] ?? '[]', true);

                if (empty($workingDaysIndices)) {
                    $payroll->update(['status' => 'draft']);
                    return redirect()->back()->with('error', __('Please configure working days first.'));
                }

                // Calculate working days in pay period
                $startDate = new \DateTime($payroll->pay_period_start);
                $endDate = new \DateTime($payroll->pay_period_end);
                $workingDaysCount = 0;

                for ($date = clone $startDate; $date <= $endDate; $date->modify('+1 day')) {
                    $dayIndex = (int) $date->format('w');
                    if (in_array($dayIndex, $workingDaysIndices)) {
                        $workingDaysCount++;
                    }
                }


                // Get all employees
                $employees = Employee::with('user')->where('created_by', creatorId())->get();
                $newEntriesCount = 0;

                foreach ($employees as $employee) {
                    // Check if payroll entry already exists for this employee
                    $existingEntry = PayrollEntry::where('payroll_id', $payroll->id)
                        ->where('employee_id', $employee->user_id)
                        ->first();

                    if (!$existingEntry) {
                        $this->processEmployeePayroll($payroll, $employee, $workingDaysCount, $startDate, $endDate);
                        $newEntriesCount++;
                    }
                }

                // Calculate totals from entries
                $entries = $payroll->payrollEntries;
                $totalGrossPay = $entries->sum('gross_pay');
                $totalDeductions = $entries->sum('total_deductions');
                $totalNetPay = $entries->sum('net_pay');
                $employeeCount = $entries->count();

                // Update payroll totals
                $payroll->update([
                    'status' => 'completed',
                    'total_gross_pay' => $totalGrossPay,
                    'total_deductions' => $totalDeductions,
                    'total_net_pay' => $totalNetPay,
                    'employee_count' => $employeeCount
                ]);

                if ($newEntriesCount > 0) {
                    return redirect()->back()->with('success', __('Payroll processed successfully. New payslips created for :new employees. Total employees: :total', [
                        'new' => $newEntriesCount,
                        'total' => $entries->count(),
                    ]));
                } else {
                    return redirect()->back()->with('error', __('Payroll already processed. All employee payslips are created. Total employees: :count', [
                        'count' => $entries->count(),
                    ]));
                }
            } catch (\Exception $e) {
                $payroll->update(['status' => 'draft']);
                return redirect()->back()->with('error', __('Failed to process payroll: :error', ['error' => $e->getMessage()]));
            }
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    private function processEmployeePayroll($payroll, $employee, $workingDaysCount, $startDate, $endDate)
    {
        // Get employee basic salary
        $basicSalary = $employee->basic_salary ?? 0;
        $perDaySalary = $workingDaysCount > 0 ? $basicSalary / $workingDaysCount : 0;

        // Calculate allowances, deductions, overtimes and loans
        $allowanceData = $this->calculateAllowances($employee, $basicSalary);
        $deductionData = $this->calculateDeductions($employee, $basicSalary);
        $manualOvertimeData = $this->calculateOvertimes($employee, $basicSalary, $startDate, $endDate);
        $loanData = $this->calculateLoans($employee, $basicSalary, $startDate, $endDate);


        // Allowance breakdown
        $allowancesBreakdown = $allowanceData['breakdown'];
        $totalAllowances = $allowanceData['total'];

        // deduction breakdown
        $deductionsBreakdown = $deductionData['breakdown'];
        $totalDeductions = $deductionData['total'];

        // manual overtime breakdown
        $manualOvertimesBreakdown = $manualOvertimeData['breakdown'];
        $totalManualOvertimes = $manualOvertimeData['total'];
        $totalManualOvertimeHour =  $manualOvertimeData['totalManualOvertimeHour'];

        // loan breakdown
        $loansBreakdown = $loanData['breakdown'];
        $totalLoans = $loanData['total'];


        // Calculate attendance data
        $attendanceData = $this->calculateAttendance($employee, $startDate, $endDate);

        $presentDays = $attendanceData['present_days'];
        $halfDays = $attendanceData['half_days'];
        $absentDays = $attendanceData['absent_days'];
        $overtimeHours = $attendanceData['overtime_hours'];
        $overtimeAmount = $attendanceData['overtime_amount'];


        // Calculate leave data
        $leaveData = $this->calculateLeave($employee, $startDate, $endDate);

        $paidLeaveDays = $leaveData['paid_leave_days'];
        $unpaidLeaveDays = $leaveData['unpaid_leave_days'];

        $totalAllOverTimeHours =  $totalManualOvertimeHour + $overtimeHours;
        // Calculate final salary
        $totalEarnings = $basicSalary + $totalAllowances + $totalManualOvertimes;
        $halfDayDeduction = $perDaySalary * ($halfDays * 0.5);
        $absentDayDeduction = $perDaySalary * $absentDays;
        $unpaidLeaveDeduction = $perDaySalary * $unpaidLeaveDays;
        $totalLeaveSalaryDeductions = $unpaidLeaveDeduction + $halfDayDeduction + $absentDayDeduction;
        $totalAllDeductions = $totalDeductions + $totalLoans;
        $grossPay = $totalEarnings - $totalLeaveSalaryDeductions + $overtimeAmount; // overtimeAmount is from attendance
        $netPay = $grossPay - $totalAllDeductions;

        // Create payroll entry
        PayrollEntry::create([
            'payroll_id' => $payroll->id,
            'employee_id' => $employee->user_id,
            'basic_salary' => $basicSalary,
            'total_allowances' => $totalAllowances,

            'total_deductions' => $totalDeductions,
            'total_loans' => $totalLoans,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
            'per_day_salary' => $perDaySalary,

            // Days
            'working_days' => $workingDaysCount,
            'present_days' => $presentDays,
            'half_days' => $halfDays,
            'half_day_deduction' => $halfDayDeduction,
            'absent_days' => $absentDays,
            'absent_day_deduction' => $absentDayDeduction,
            'paid_leave_days' => $paidLeaveDays,
            'unpaid_leave_days' => $unpaidLeaveDays,
            'unpaid_leave_deduction' => $unpaidLeaveDeduction,

            // OverTime
            'manual_overtime_hours' => $totalManualOvertimeHour,
            'total_manual_overtimes' => $totalManualOvertimes,
            'attendance_overtime_hours' => $overtimeHours,
            'attendance_overtime_rate' => $employee->rate_per_hour ?? 0,
            'attendance_overtime_amount' => $overtimeAmount,
            'overtime_hours' => $totalAllOverTimeHours,

            // Breakdown JSONs
            'allowances_breakdown' => $allowancesBreakdown,
            'deductions_breakdown' => $deductionsBreakdown,
            'manual_overtimes_breakdown' => $manualOvertimesBreakdown,
            'loans_breakdown' => $loansBreakdown,

            'creator_id' => Auth::id(),
            'created_by' => creatorId(),
        ]);
    }

    private function calculateAllowances($employee, $basicSalary)
    {
        $allowances = Allowance::where('employee_id', $employee->user_id)->where('created_by', creatorId())->get();
        $breakdown = [];
        $total = 0;

        foreach ($allowances as $allowance) {
            $allowanceType = $allowance->allowanceType;
            $name = $allowanceType->name ?? 'Allowance';

            if ($allowance && $allowance->type === 'percentage') {
                $amount = ($basicSalary * $allowance->amount) / 100;
            } else {
                $amount = $allowance->amount;
            }

            $breakdown[$name] = $amount;
            $total += $amount;
        }

        return ['breakdown' => $breakdown, 'total' => $total];
    }

    private function calculateDeductions($employee, $basicSalary)
    {
        $deductions = Deduction::where('employee_id', $employee->user_id)->where('created_by', creatorId())->get();
        $breakdown = [];
        $total = 0;

        foreach ($deductions as $deduction) {
            $deductionType = $deduction->deductionType;
            $name = $deductionType->name ?? 'Deduction';

            if ($deduction && $deduction->type === 'percentage') {
                $amount = ($basicSalary * $deduction->amount) / 100;
            } else {
                $amount = $deduction->amount;
            }

            $breakdown[$name] = $amount;
            $total += $amount;
        }

        return ['breakdown' => $breakdown, 'total' => $total];
    }

    private function calculateAttendance($employee, $startDate, $endDate)
    {
        $attendances = Attendance::where('employee_id', $employee->user_id)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        $presentDays = $attendances->where('status', 'present')->count();
        $halfDays = $attendances->where('status', 'half day')->count();
        $absentDays = $attendances->where('status', 'absent')->count();
        $overtimeHours = $attendances->sum('overtime_hours') ?? 0;

        // Calculate overtime amount using employee overtime rate
        $attendanceOvertimeRate = $employee->rate_per_hour ?? 0;
        $overtimeAmount = $overtimeHours * $attendanceOvertimeRate;

        return [
            'present_days' => $presentDays,
            'half_days' => $halfDays,
            'absent_days' => $absentDays,
            'overtime_hours' => $overtimeHours,
            'overtime_amount' => $overtimeAmount
        ];
    }

    private function calculateLeave($employee, $startDate, $endDate)
    {
        $leaveApplications = LeaveApplication::with('leave_type')->where('employee_id', $employee->user_id)
            ->where('status', 'approved')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', values: [$startDate, $endDate]);
            })
            ->get();

        $paidLeaveDays = 0;
        $unpaidLeaveDays = 0;

        foreach ($leaveApplications as $leave) {
            $leaveDays = max(1, $leave->start_date->diffInDays($leave->end_date) + 1);
            if ($leave->leave_type && $leave->leave_type->is_paid) {
                $paidLeaveDays += $leaveDays;
            } else {
                $unpaidLeaveDays += $leaveDays;
            }
        }
        return [
            'paid_leave_days' => $paidLeaveDays,
            'unpaid_leave_days' => $unpaidLeaveDays
        ];
    }

    private function calculateOvertimes($employee, $basicSalary, $startDate, $endDate)
    {
        $overtimes = Overtime::where('employee_id', $employee->user_id)
            ->where('created_by', creatorId())
            ->where('status', 'active')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->orWhereBetween('end_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            })
            ->get();

        $breakdown = [];
        $total = 0;
        $totalManualOvertimeHour = 0;

        foreach ($overtimes as $overtime) {
            $name = $overtime->title ?? 'Manual Overtime';
            $amount = $overtime->hours * $overtime->rate;

            $breakdown[$name] = $amount;
            $total += $amount;
            $totalManualOvertimeHour += $overtime->hours;
        }

        return ['breakdown' => $breakdown, 'total' => $total, 'totalManualOvertimeHour' => $totalManualOvertimeHour];
    }

    private function calculateLoans($employee, $basicSalary, $startDate, $endDate)
    {
        $loans = Loan::with('loanType')->where('employee_id', $employee->user_id)
            ->where('created_by', creatorId())
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
                    ->orWhereBetween('end_date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]);
            })
            ->get();

        $breakdown = [];
        $total = 0;

        foreach ($loans as $loan) {
            $loanType = $loan->loanType;
            $name = $loanType->name ?? 'Loan';

            if ($loan->type === 'percentage') {
                $amount = ($basicSalary * $loan->amount) / 100;
            } else {
                $amount = $loan->amount;
            }

            $breakdown[$name] = $amount;
            $total += $amount;
        }

        return ['breakdown' => $breakdown, 'total' => $total];
    }

    public function destroyEntry(PayrollEntry $payrollEntry)
    {
        if (Auth::user()->can('delete-payslip')) {
            $payroll = Payroll::find($payrollEntry->payroll_id);
            DestroySalarySlip::dispatch($payrollEntry);
            // Delete the entry
            $payrollEntry->delete();

            // Recalculate totals from remaining entries
            $entries = $payroll->payrollEntries;
            $totalGrossPay = $entries->sum('gross_pay');
            $totalDeductions = $entries->sum('total_deductions');
            $totalNetPay = $entries->sum('net_pay');
            $employeeCount = $entries->count();

            // Update payroll totals
            $payroll->update([
                'total_gross_pay' => $totalGrossPay,
                'total_deductions' => $totalDeductions,
                'total_net_pay' => $totalNetPay,
                'employee_count' => $employeeCount
            ]);

            return redirect()->back()->with('success', __('Payroll entry deleted successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function printPayslip(PayrollEntry $payrollEntry)
    {
        if (Auth::user()->can('download-payslip')) {
            $payrollEntry->load(['employee.user', 'employee.designation', 'payroll']);

            return Inertia::render('Hrm/Payrolls/payslip/Payslip', [
                'payrollEntry' => $payrollEntry,
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function paySalary(Request $request, PayrollEntry $payrollEntry)
    {
        if (Auth::user()->can('pay-payslip')) {
            try {
                PaySalary::dispatch($request, $payrollEntry);
            } catch (\Throwable $th) {
                return redirect()->back()->with('error', $th->getMessage());
            }
            $payrollEntry->update(['status' => 'paid']);

            // Check if all payroll entries are paid and update payroll status
            $payroll = $payrollEntry->payroll;
            $unpaidEntries = $payroll->payrollEntries()->where('status', '!=', 'paid')->count();
            if ($unpaidEntries === 0) {
                $payroll->update(['is_payroll_paid' => 'paid']);
            }

            return redirect()->back()->with('success', __('Payment status updated successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }
}
