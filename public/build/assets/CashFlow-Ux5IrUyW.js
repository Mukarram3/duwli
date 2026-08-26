import{a3 as d,a0 as e}from"./ui-CUd_MbMF.js";import{X as h,S as b}from"./app-Dy1IrXMK.js";import{a as g}from"./html2pdf-C_uK44ce.js";import{j as s,c as r,b as i}from"./helpers-BVBeZFk6.js";import{u as f}from"./useTranslation-CTQo533R.js";function w(){const{t:a}=f(),{data:t,filters:o}=h().props,[l,c]=d.useState(!1);d.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&m()},[]);const m=async()=>{c(!0);const n=document.querySelector(".report-container");if(n){const x={margin:.25,filename:"cash-flow-statement.pdf",image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await g().set(x).from(n).save(),setTimeout(()=>window.close(),1e3)}catch(p){console.error("PDF generation failed:",p)}}c(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(b,{title:a("Cash Flow Statement")}),l&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:a("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-5xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:s("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[s("company_address")&&e.jsx("p",{children:s("company_address")}),(s("company_city")||s("company_state")||s("company_zipcode"))&&e.jsxs("p",{children:[s("company_city"),s("company_state")&&`, ${s("company_state")}`," ",s("company_zipcode")]}),s("company_country")&&e.jsx("p",{children:s("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:a("CASH FLOW STATEMENT")}),e.jsxs("p",{className:"text-sm text-gray-600",children:[r(o.from_date)," ",a("to")," ",r(o.to_date)]})]})]})}),e.jsx("table",{className:"w-full border-collapse",children:e.jsxs("tbody",{children:[e.jsxs("tr",{className:"border-b-2 border-black page-break-inside-avoid",children:[e.jsx("td",{className:"py-3 text-sm font-bold",children:a("Beginning Cash Balance")}),e.jsx("td",{className:"py-3 text-sm font-bold text-right tabular-nums w-40",children:i(t.beginning_cash)})]}),e.jsx("tr",{className:"page-break-inside-avoid",children:e.jsx("td",{colSpan:2,className:"pt-6 pb-2",children:e.jsx("h3",{className:"font-bold text-base",children:a("Cash Flow from Operating Activities")})})}),e.jsxs("tr",{className:"page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 pl-6 text-sm",children:a("Net cash from operations")}),e.jsx("td",{className:"py-2 text-sm text-right font-semibold tabular-nums",children:i(t.operating)})]}),e.jsx("tr",{className:"page-break-inside-avoid",children:e.jsx("td",{colSpan:2,className:"pt-4 pb-2",children:e.jsx("h3",{className:"font-bold text-base",children:a("Cash Flow from Investing Activities")})})}),e.jsxs("tr",{className:"page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 pl-6 text-sm",children:a("Net cash from investing")}),e.jsx("td",{className:"py-2 text-sm text-right font-semibold tabular-nums",children:i(t.investing)})]}),e.jsx("tr",{className:"page-break-inside-avoid",children:e.jsx("td",{colSpan:2,className:"pt-4 pb-2",children:e.jsx("h3",{className:"font-bold text-base",children:a("Cash Flow from Financing Activities")})})}),e.jsxs("tr",{className:"page-break-inside-avoid",children:[e.jsx("td",{className:"py-2 pl-6 text-sm",children:a("Net cash from financing")}),e.jsx("td",{className:"py-2 text-sm text-right font-semibold tabular-nums",children:i(t.financing)})]}),e.jsxs("tr",{className:"border-t-2 border-gray-400 page-break-inside-avoid",children:[e.jsx("td",{className:"py-3 text-sm font-bold",children:a("Net Increase/Decrease in Cash")}),e.jsx("td",{className:"py-3 text-sm font-bold text-right tabular-nums",children:i(t.net_cash_flow)})]}),e.jsxs("tr",{className:"border-t-4 border-black page-break-inside-avoid",children:[e.jsx("td",{className:"py-4 text-base font-bold",children:a("Ending Cash Balance")}),e.jsx("td",{className:"py-4 text-base font-bold text-right tabular-nums",children:i(t.ending_cash)})]})]})}),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[a("Generated on")," ",r(new Date().toISOString())]})})]}),e.jsx("style",{children:`
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
            `})]})}export{w as default};
