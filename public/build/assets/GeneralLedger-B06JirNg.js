import{a3 as c,a0 as e}from"./ui-CUd_MbMF.js";import{X as b,S as y}from"./app-BsGvDwKR.js";import{a as f}from"./html2pdf-DAxXavRw.js";import{j as a,c as l,b as i}from"./helpers-dl1HDxIx.js";import{u as g}from"./useTranslation-IoBPjh8d.js";function v(){const{t}=g(),{data:n,selectedAccount:r,filters:d}=b().props,[m,o]=c.useState(!1);c.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&x()},[]);const x=async()=>{o(!0);const s=document.querySelector(".report-container");if(s){const p={margin:.25,filename:`general-ledger-${(r==null?void 0:r.account_code)||"report"}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await f().set(p).from(s).save(),setTimeout(()=>window.close(),1e3)}catch(h){console.error("PDF generation failed:",h)}}o(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(y,{title:t("General Ledger")}),m&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:t("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-5xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:a("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[a("company_address")&&e.jsx("p",{children:a("company_address")}),(a("company_city")||a("company_state")||a("company_zipcode"))&&e.jsxs("p",{children:[a("company_city"),a("company_state")&&`, ${a("company_state")}`," ",a("company_zipcode")]}),a("company_country")&&e.jsx("p",{children:a("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:t("GENERAL LEDGER")}),r&&e.jsxs("div",{className:"text-sm text-gray-700 space-y-1",children:[e.jsxs("p",{className:"font-semibold text-base",children:[r.account_code," - ",r.account_name]}),d.from_date&&d.to_date&&e.jsxs("p",{className:"text-gray-600",children:[l(d.from_date)," ",t("to")," ",l(d.to_date)]})]})]})]})}),e.jsxs("table",{className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-black",children:[e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-24",children:t("Date")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold",children:t("Description")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-28",children:t("Reference")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-24",children:t("Debit")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-24",children:t("Credit")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-28",children:t("Balance")})]})}),e.jsxs("tbody",{children:[n.opening_balance!==0&&e.jsxs("tr",{className:"border-b border-gray-300",children:[e.jsx("td",{colSpan:5,className:"py-2 px-3 text-sm font-semibold",children:t("Opening Balance")}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-semibold tabular-nums",children:i(n.opening_balance)})]}),n.transactions.map(s=>e.jsxs("tr",{className:"border-b border-gray-200 page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 px-3 text-sm whitespace-nowrap",children:l(s.date)}),e.jsx("td",{className:"py-2 px-3 text-sm break-words",children:s.description}),e.jsx("td",{className:"py-2 px-3 text-sm",children:s.reference_type}),e.jsx("td",{className:"py-2 px-3 text-sm text-right tabular-nums",children:s.debit>0?i(s.debit):"-"}),e.jsx("td",{className:"py-2 px-3 text-sm text-right tabular-nums",children:s.credit>0?i(s.credit):"-"}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-medium tabular-nums",children:i(s.balance)})]},s.id)),e.jsxs("tr",{className:"border-t-2 border-black",children:[e.jsx("td",{colSpan:5,className:"py-2 px-3 text-sm font-bold",children:t("Closing Balance")}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-bold tabular-nums",children:i(n.closing_balance)})]})]})]}),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[t("Generated on")," ",l(new Date().toISOString())]})})]}),e.jsx("style",{children:`
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
            `})]})}export{v as default};
