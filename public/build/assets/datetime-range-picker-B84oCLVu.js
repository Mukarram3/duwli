import{a3 as g,a0 as r}from"./ui-CUd_MbMF.js";import{D as v}from"./react-datepicker-CGtv4Wly.js";import{c as k}from"./utils-CmeZxMYV.js";import{B as y}from"./button-C5lU6IWQ.js";import{P as D,b as T,a as $}from"./popover-CIO0YLfd.js";import{u as N}from"./useTranslation-CTQo533R.js";import{C}from"./calendar-C3Mk7bnn.js";function R({value:i,onChange:d,placeholder:_,className:w,id:P,required:E,timeFormat:u="HH:mm",dateFormat:h="MMM d, yyyy h:mm aa",mode:t="range"}){const{t:c}=N(),[x,f]=g.useState(!1),[a,m]=g.useState(null),[o,p]=g.useState(null);g.useEffect(()=>{if(i)if(t==="single")m(new Date(i.replace(" ","T"))),p(null);else{const[e,n]=i.split(" - ");m(e?new Date(e.replace(" ","T")):null),p(n?new Date(n.replace(" ","T")):null)}else m(null),p(null)},[i,t]);const S=(e,n)=>{const l={year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return t==="single"?e?e.toLocaleDateString("en-US",l):"":!e||!n?"":`${e.toLocaleDateString("en-US",l)} - ${n.toLocaleDateString("en-US",l)}`},s=e=>{const n=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,l=`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`;return`${n} ${l}`},b=e=>{e&&(m(e),t==="single"?(d(s(e)),f(!1)):d(o?`${s(e)} - ${s(o)}`:`${s(e)} - `))},j=e=>{e&&a&&(p(e),d(`${s(a)} - ${s(e)}`),f(!1))};return r.jsxs("div",{className:k("w-full",w),onWheel:e=>{x||e.stopPropagation()},children:[r.jsxs(D,{open:x,onOpenChange:f,modal:!1,children:[r.jsx(T,{asChild:!0,children:r.jsxs(y,{variant:"outline",className:k("w-full justify-start text-left font-normal h-10",!i&&"text-muted-foreground"),children:[r.jsx(C,{className:"mr-2 h-4 w-4"}),i&&a&&(t==="single"||o)?S(a,o):_||c(t==="single"?"Select date time":"Select date time range")]})}),r.jsx($,{className:"w-auto p-0",align:"start",onWheel:e=>{e.stopPropagation()},children:r.jsx("div",{className:"datetime-range-wrapper",children:t==="single"?r.jsxs("div",{className:"p-3",children:[r.jsx("div",{className:"text-sm font-medium mb-2 text-center",children:c("Select Date & Time")}),r.jsx(v,{selected:a,onChange:b,showTimeSelect:!0,timeFormat:u,timeIntervals:15,timeCaption:"Time",dateFormat:h,inline:!0})]}):r.jsxs("div",{className:"flex",children:[r.jsxs("div",{className:"p-3 border-r border-border",children:[r.jsx("div",{className:"text-sm font-medium mb-2 text-center",children:c("Start Date & Time")}),r.jsx(v,{selected:a,onChange:b,showTimeSelect:!0,timeFormat:u,timeIntervals:15,timeCaption:"Time",dateFormat:h,inline:!0,maxDate:o||void 0})]}),r.jsxs("div",{className:"p-3",children:[r.jsx("div",{className:"text-sm font-medium mb-2 text-center",children:c("End Date & Time")}),r.jsx(v,{selected:o,onChange:j,showTimeSelect:!0,timeFormat:u,timeIntervals:15,timeCaption:"Time",dateFormat:h,inline:!0,minDate:a||void 0})]})]})})})]}),r.jsx("style",{children:`
        .datetime-range-wrapper .react-datepicker {
          font-family: inherit;
          border: none;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .datetime-range-wrapper .react-datepicker__header {
          background: hsl(var(--background));
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 0;
        }
        .datetime-range-wrapper .react-datepicker__current-month,
        .datetime-range-wrapper .react-datepicker__day-name {
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        .datetime-range-wrapper .react-datepicker__day {
          color: hsl(var(--foreground));
          border-radius: 6px;
        }
        .datetime-range-wrapper .react-datepicker__day:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }
        .datetime-range-wrapper .react-datepicker__day--selected {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .datetime-range-wrapper .react-datepicker__navigation {
          border: none;
          border-radius: 6px;
        }
        .datetime-range-wrapper .react-datepicker__navigation:hover {
          background: hsl(var(--accent));
        }
        .datetime-range-wrapper .react-datepicker__navigation-icon::before {
          border-color: hsl(var(--foreground));
        }
        .datetime-range-wrapper .react-datepicker__day--outside-month {
          color: hsl(var(--muted-foreground));
        }
        .datetime-range-wrapper .react-datepicker__day--disabled {
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
        }
        .datetime-range-wrapper .react-datepicker__time-container {
          background: hsl(var(--background));
          border-left: 1px solid hsl(var(--border));
        }
        .datetime-range-wrapper .react-datepicker__time {
          background: hsl(var(--background));
        }
        .datetime-range-wrapper .react-datepicker__time-box {
          background: hsl(var(--background));
        }
        .datetime-range-wrapper .react-datepicker__time-list-item {
          color: hsl(var(--foreground));
        }
        .datetime-range-wrapper .react-datepicker__time-list-item:hover {
          background: hsl(var(--accent));
        }
        .datetime-range-wrapper .react-datepicker__time-list-item--selected {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .datetime-range-wrapper .react-datepicker__time-name {
          color: hsl(var(--foreground));
        }
      `})]})}export{R as D};
