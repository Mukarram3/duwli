import{a3 as C,a0 as e}from"./ui-CUd_MbMF.js";import{D}from"./react-datepicker-CGtv4Wly.js";import{c as d}from"./utils-CmeZxMYV.js";import{B as S}from"./button-C5lU6IWQ.js";import{P,b as E,a as N}from"./popover-CIO0YLfd.js";import{u as $}from"./useTranslation-Du1S9xKG.js";import{C as B}from"./calendar-C3Mk7bnn.js";function I({value:a,onChange:c,placeholder:i,className:s,id:p,required:l,maxDate:k,minDate:u,showYearDropdown:h=!0,showMonthDropdown:g=!0,style:m}){const{t:w}=$(),[_,n]=C.useState(!1),f=r=>r?new Date(r):null,x=r=>{if(!r)return"";const o={year:"numeric",month:"short",day:"numeric"};return r.toLocaleDateString("en-US",o)},t=f(a),v=r=>{if(r){const o=r.getFullYear(),b=String(r.getMonth()+1).padStart(2,"0"),y=String(r.getDate()).padStart(2,"0"),j=`${o}-${b}-${y}`;c(j),n(!1)}else c("")};return e.jsxs("div",{className:d("w-full",s),children:[p&&e.jsx("input",{id:p,type:"hidden",value:a||"",required:l}),e.jsxs(P,{open:_,onOpenChange:n,children:[e.jsx(E,{asChild:!0,children:e.jsxs(S,{variant:"outline",className:d("w-full justify-start text-left font-normal h-10",!a&&"text-muted-foreground"),style:m,children:[e.jsx(B,{className:"mr-2 h-4 w-4"}),a&&t?x(t):i||w("Select date")]})}),e.jsx(N,{className:"w-auto p-0",align:"start",children:e.jsx("div",{className:"date-picker-wrapper",children:e.jsx(D,{selected:t,onChange:v,inline:!0,showPopperArrow:!1,maxDate:k,minDate:u,showYearDropdown:h,showMonthDropdown:g,dropdownMode:"select",yearDropdownItemNumber:100})})})]}),e.jsx("style",{children:`
        .date-picker-wrapper .react-datepicker {
          font-family: inherit;
          border: none;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .date-picker-wrapper .react-datepicker__header {
          background: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
        }
        .date-picker-wrapper .react-datepicker__current-month,
        .date-picker-wrapper .react-datepicker__day-name {
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        .date-picker-wrapper .react-datepicker__day {
          color: hsl(var(--foreground));
          border-radius: 6px;
        }
        .date-picker-wrapper .react-datepicker__day:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        .date-picker-wrapper .react-datepicker__day--selected {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .date-picker-wrapper .react-datepicker__navigation {
          border: none;
          border-radius: 6px;
        }
        .date-picker-wrapper .react-datepicker__navigation:hover {
          background: hsl(var(--accent));
        }
        .date-picker-wrapper .react-datepicker__navigation-icon::before {
          border-color: hsl(var(--foreground));
        }
        .date-picker-wrapper .react-datepicker__day--outside-month {
          color: hsl(var(--muted-foreground));
        }
        .date-picker-wrapper .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
        .date-picker-wrapper .react-datepicker__month-container {
          background: hsl(var(--background));
        }
        .date-picker-wrapper .react-datepicker__header__dropdown {
          display: flex;
          gap: 8px;
          justify-content: center;
          padding: 8px 0;
        }
        .date-picker-wrapper .react-datepicker__month-dropdown-container,
        .date-picker-wrapper .react-datepicker__year-dropdown-container {
          margin: 0;
        }
        .date-picker-wrapper .react-datepicker__year-select,
        .date-picker-wrapper .react-datepicker__month-select {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 6px 32px 6px 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 12px;
          min-width: 80px;
        }
        .date-picker-wrapper .react-datepicker__month-select {
          min-width: 100px;
        }
        .date-picker-wrapper .react-datepicker__year-select:hover,
        .date-picker-wrapper .react-datepicker__month-select:hover {
          background-color: hsl(var(--accent));
          border-color: hsl(var(--border));
        }
        .date-picker-wrapper .react-datepicker__year-select:focus,
        .date-picker-wrapper .react-datepicker__month-select:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
      `})]})}export{I as D};
