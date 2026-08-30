import{a3 as w,a0 as a}from"./ui-CUd_MbMF.js";import{D as v}from"./react-datepicker-CGtv4Wly.js";import{c as p}from"./utils-CmeZxMYV.js";import{B as b}from"./button-C5lU6IWQ.js";import{P as S,b as y,a as x}from"./popover-CIO0YLfd.js";import{u as $}from"./useTranslation-DXkxXsp_.js";import{C as j}from"./calendar-C3Mk7bnn.js";function E({value:o,onChange:d,placeholder:l,className:g,id:D,required:P}){const{t:u}=$(),[h,i]=w.useState(!1),m=t=>{if(!t)return[null,null];const[r,e]=t.split(" - ");return[r?new Date(r):null,e?new Date(e):null]},f=(t,r)=>{if(!t||!r)return"";const e={year:"numeric",month:"short",day:"numeric"};return`${t.toLocaleDateString("en-US",e)} - ${r.toLocaleDateString("en-US",e)}`},[n,c]=m(o),_=t=>{const[r,e]=t;if(r&&e){const s=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`,k=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`;d(`${s} - ${k}`),i(!1)}else if(r&&!e){const s=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`;d(`${s} - `)}else d("")};return a.jsxs("div",{className:p("w-full",g),children:[a.jsxs(S,{open:h,onOpenChange:i,children:[a.jsx(y,{asChild:!0,children:a.jsxs(b,{variant:"outline",className:p("w-full justify-start text-left font-normal h-10",!o&&"text-muted-foreground"),children:[a.jsx(j,{className:"mr-2 h-4 w-4"}),o&&n&&c?f(n,c):l||u("Select date range")]})}),a.jsx(x,{className:"w-auto p-0",align:"start",children:a.jsx("div",{className:"date-range-wrapper",children:a.jsx(v,{selected:n,onChange:_,startDate:n,endDate:c,selectsRange:!0,monthsShown:2,inline:!0,showPopperArrow:!1})})})]}),a.jsx("style",{children:`
        .date-range-wrapper .react-datepicker {
          font-family: inherit;
          border: none;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .date-range-wrapper .react-datepicker__header {
          background: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
        }
        .date-range-wrapper .react-datepicker__current-month,
        .date-range-wrapper .react-datepicker__day-name {
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        .date-range-wrapper .react-datepicker__day {
          color: hsl(var(--foreground));
          border-radius: 6px;
        }
        .date-range-wrapper .react-datepicker__day:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        .date-range-wrapper .react-datepicker__day--selected,
        .date-range-wrapper .react-datepicker__day--in-selecting-range,
        .date-range-wrapper .react-datepicker__day--in-range {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .date-range-wrapper .react-datepicker__day--range-start,
        .date-range-wrapper .react-datepicker__day--range-end {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .date-range-wrapper .react-datepicker__navigation {
          border: none;
          border-radius: 6px;
        }
        .date-range-wrapper .react-datepicker__navigation:hover {
          background: hsl(var(--accent));
        }
        .date-range-wrapper .react-datepicker__navigation-icon::before {
          border-color: hsl(var(--foreground));
        }
        .date-range-wrapper .react-datepicker__day--outside-month {
          color: hsl(var(--muted-foreground));
        }
        .date-range-wrapper .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
        .date-range-wrapper .react-datepicker__month-container {
          background: hsl(var(--background));
        }
      `})]})}export{E as D};
