import{a3 as m,a0 as e}from"./ui-CUd_MbMF.js";import{X as j,S as f}from"./app-Cvy9WmVZ.js";import{a as g}from"./html2pdf-CwKhjylI.js";import{j as a,c as o,b as r}from"./helpers-DrZzmirM.js";import{u}from"./useTranslation-BaiNzLDd.js";function S(){const{t:s}=u(),{data:n,selectedAccount:i,filters:d}=j().props,[x,l]=m.useState(!1),p=n.transactions.reduce((t,c)=>t+c.debit,0),b=n.transactions.reduce((t,c)=>t+c.credit,0);m.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&h()},[]);const h=async()=>{l(!0);const t=document.querySelector(".report-container");if(t){const c={margin:.25,filename:`account-statement-${(i==null?void 0:i.account_code)||"report"}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await g().set(c).from(t).save(),setTimeout(()=>window.close(),1e3)}catch(y){console.error("PDF generation failed:",y)}}l(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(f,{title:s("Account Statement")}),x&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:s("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-5xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:a("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[a("company_address")&&e.jsx("p",{children:a("company_address")}),(a("company_city")||a("company_state")||a("company_zipcode"))&&e.jsxs("p",{children:[a("company_city"),a("company_state")&&`, ${a("company_state")}`," ",a("company_zipcode")]}),a("company_country")&&e.jsx("p",{children:a("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:s("ACCOUNT STATEMENT")}),i&&e.jsxs("div",{className:"text-sm text-gray-700 space-y-1",children:[e.jsxs("p",{className:"font-semibold text-base",children:[i.account_code," - ",i.account_name]}),d.from_date&&d.to_date&&e.jsxs("p",{className:"text-gray-600",children:[o(d.from_date)," ",s("to")," ",o(d.to_date)]})]})]})]})}),e.jsxs("table",{className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-black",children:[e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-24",children:s("Date")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold",children:s("Description")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-28",children:s("Reference")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-24",children:s("Debit")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-24",children:s("Credit")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-28",children:s("Balance")})]})}),e.jsxs("tbody",{children:[n.opening_balance!==0&&e.jsxs("tr",{className:"border-b border-gray-300",children:[e.jsx("td",{colSpan:5,className:"py-2 px-3 text-sm font-semibold",children:s("Opening Balance")}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-semibold tabular-nums",children:r(n.opening_balance)})]}),n.transactions.map(t=>e.jsxs("tr",{className:"border-b border-gray-200 page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 px-3 text-sm whitespace-nowrap",children:o(t.date)}),e.jsx("td",{className:"py-2 px-3 text-sm break-words",children:t.description}),e.jsx("td",{className:"py-2 px-3 text-sm",children:t.reference_type}),e.jsx("td",{className:"py-2 px-3 text-sm text-right tabular-nums",children:t.debit>0?r(t.debit):"-"}),e.jsx("td",{className:"py-2 px-3 text-sm text-right tabular-nums",children:t.credit>0?r(t.credit):"-"}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-medium tabular-nums",children:r(t.balance)})]},t.id)),e.jsxs("tr",{className:"border-t-2 border-gray-400",children:[e.jsx("td",{colSpan:3,className:"py-2 px-3 text-sm font-bold",children:s("Total")}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-bold tabular-nums",children:r(p)}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-bold tabular-nums",children:r(b)}),e.jsx("td",{className:"py-2 px-3 text-sm"})]}),e.jsxs("tr",{className:"border-t-2 border-black",children:[e.jsx("td",{colSpan:5,className:"py-2 px-3 text-sm font-bold",children:s("Closing Balance")}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-bold tabular-nums",children:r(n.closing_balance)})]})]})]}),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[s("Generated on")," ",o(new Date().toISOString())]})})]}),e.jsx("style",{children:`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.25in;
                    size: A4;
                }

                .report-container {
                    max-width: 100%;
                    margin: 0;
                    box-shadow: none;
                }

                .page-break-inside-avoid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                @media print {
                    body {
                        background: white;
                    }

                    .report-container {
                        box-shadow: none;
                    }

                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `})]})}export{S as default};
