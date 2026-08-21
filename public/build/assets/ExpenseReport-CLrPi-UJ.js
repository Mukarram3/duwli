import{a3 as l,a0 as e}from"./ui-CUd_MbMF.js";import{X as b,S as y}from"./app-CHNISACI.js";import{a as f}from"./html2pdf-my3-1pp5.js";import{j as t,c as o,b as d}from"./helpers-bMszKSoK.js";import{u as j}from"./useTranslation-gWsh8TRR.js";function _(){const{t:s}=j(),{data:r,filters:i}=b().props,[m,c]=l.useState(!1),x=a=>r.total_expenses===0?0:(a/r.total_expenses*100).toFixed(1);l.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&p()},[]);const p=async()=>{c(!0);const a=document.querySelector(".report-container");if(a){const n={margin:.25,filename:"expense-report.pdf",image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await f().set(n).from(a).save(),setTimeout(()=>window.close(),1e3)}catch(h){console.error("PDF generation failed:",h)}}c(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(y,{title:s("Expense Report")}),m&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:s("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-5xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:t("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[t("company_address")&&e.jsx("p",{children:t("company_address")}),(t("company_city")||t("company_state")||t("company_zipcode"))&&e.jsxs("p",{children:[t("company_city"),t("company_state")&&`, ${t("company_state")}`," ",t("company_zipcode")]}),t("company_country")&&e.jsx("p",{children:t("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:s("EXPENSE REPORT")}),e.jsxs("p",{className:"text-sm text-gray-600",children:[o(i.from_date)," ",s("to")," ",o(i.to_date)]})]})]})}),e.jsxs("table",{className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-black",children:[e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-16",children:s("Rank")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold w-24",children:s("Account Code")}),e.jsx("th",{className:"text-left py-2 px-3 text-sm font-semibold",children:s("Expense Category")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-32",children:s("Amount")}),e.jsx("th",{className:"text-right py-2 px-3 text-sm font-semibold w-24",children:s("% of Total")})]})}),e.jsxs("tbody",{children:[r.expenses.map((a,n)=>e.jsxs("tr",{className:"border-b border-gray-200 page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 px-3 text-sm font-medium",children:n+1}),e.jsx("td",{className:"py-2 px-3 text-sm",children:a.account_code}),e.jsx("td",{className:"py-2 px-3 text-sm break-words",children:a.account_name}),e.jsx("td",{className:"py-2 px-3 text-sm text-right font-semibold tabular-nums",children:d(a.amount)}),e.jsxs("td",{className:"py-2 px-3 text-sm text-right tabular-nums",children:[x(a.amount),"%"]})]},n)),e.jsxs("tr",{className:"border-t-2 border-black",children:[e.jsx("td",{colSpan:3,className:"py-3 px-3 text-sm font-bold",children:s("Total Expenses")}),e.jsx("td",{className:"py-3 px-3 text-sm text-right font-bold tabular-nums",children:d(r.total_expenses)}),e.jsx("td",{className:"py-3 px-3 text-sm text-right font-bold tabular-nums",children:"100%"})]})]})]}),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[s("Generated on")," ",o(new Date().toISOString())]})})]}),e.jsx("style",{children:`
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
            `})]})}export{_ as default};
