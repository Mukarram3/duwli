<?php

namespace Workdo\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PayrollEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'basic_salary',
        'total_allowances',
        'total_manual_overtimes',
        'total_deductions',
        'total_loans',
        'gross_pay',
        'net_pay',
        'attendance_overtime_amount',
        'attendance_overtime_rate',
        'per_day_salary',
        'unpaid_leave_deduction',
        'half_day_deduction',
        'absent_day_deduction',
        'working_days',
        'present_days',
        'half_days',
        'absent_days',
        'paid_leave_days',
        'unpaid_leave_days',
        'manual_overtime_hours',
        'attendance_overtime_hours',
        'overtime_hours',
        'allowances_breakdown',
        'deductions_breakdown',
        'manual_overtimes_breakdown',
        'loans_breakdown',
        'status',
        'creator_id',
        'created_by',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'total_allowances' => 'decimal:2',
        'total_manual_overtimes' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_loans' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'attendance_overtime_amount' => 'decimal:2',
        'attendance_overtime_rate' => 'decimal:2',
        'per_day_salary' => 'decimal:2',
        'unpaid_leave_deduction' => 'decimal:2',
        'half_day_deduction' => 'decimal:2',
        'absent_day_deduction' => 'decimal:2',
        'half_days' => 'decimal:2',
        'manual_overtime_hours' => 'decimal:2',
        'attendance_overtime_hours' => 'decimal:2',
        'allowances_breakdown' => 'array',
        'deductions_breakdown' => 'array',
        'manual_overtimes_breakdown' => 'array',
        'loans_breakdown' => 'array',
    ];

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class,'employee_id','user_id');
    }
}