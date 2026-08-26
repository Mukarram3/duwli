import{a3 as l,a0 as e}from"./ui-CUd_MbMF.js";import{X as b,S as h}from"./app-Dy1IrXMK.js";import{a as j}from"./html2pdf-C_uK44ce.js";import{j as a,c as n,b as d}from"./helpers-BVBeZFk6.js";import{u as f}from"./useTranslation-CTQo533R.js";function v(){const{t}=f(),{data:m,filters:i}=b().props,[x,c]=l.useState(!1);l.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&p()},[]);const p=async()=>{c(!0);const s=document.querySelector(".report-container");if(s){const r={margin:.25,filename:"journal-entry-report.pdf",image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"landscape"}};try{await j().set(r).from(s).save(),setTimeout(()=>window.close(),1e3)}catch(o){console.error("PDF generation failed:",o)}}c(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(h,{title:t("Journal Entry Report")}),x&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:t("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-6xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:a("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[a("company_address")&&e.jsx("p",{children:a("company_address")}),(a("company_city")||a("company_state")||a("company_zipcode"))&&e.jsxs("p",{children:[a("company_city"),a("company_state")&&`, ${a("company_state")}`," ",a("company_zipcode")]}),a("company_country")&&e.jsx("p",{children:a("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:t("JOURNAL ENTRY REPORT")}),i.from_date&&i.to_date&&e.jsxs("p",{className:"text-sm text-gray-600",children:[n(i.from_date)," ",t("to")," ",n(i.to_date)]})]})]})}),m.map(s=>e.jsxs("div",{className:"mb-6 border border-gray-300 p-4 page-break-inside-avoid",children:[e.jsxs("div",{className:"flex justify-between mb-3 pb-2 border-b border-gray-200",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-base",children:s.journal_number}),e.jsxs("p",{className:"text-sm text-gray-600",children:[n(s.date)," | ",s.reference_type]}),e.jsx("p",{className:"text-sm text-gray-700",children:s.description})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-sm font-semibold",children:s.status==="posted"?t("Posted"):t("Draft")}),!s.is_balanced&&e.jsx("p",{className:"text-sm text-red-600 font-semibold",children:t("Unbalanced")})]})]}),e.jsxs("table",{className:"w-full border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-black",children:[e.jsx("th",{className:"text-left py-2 px-2 text-sm font-semibold w-24",children:t("Account Code")}),e.jsx("th",{className:"text-left py-2 px-2 text-sm font-semibold w-48",children:t("Account Name")}),e.jsx("th",{className:"text-left py-2 px-2 text-sm font-semibold",children:t("Description")}),e.jsx("th",{className:"text-right py-2 px-2 text-sm font-semibold w-28",children:t("Debit")}),e.jsx("th",{className:"text-right py-2 px-2 text-sm font-semibold w-28",children:t("Credit")})]})}),e.jsxs("tbody",{children:[s.items.map((r,o)=>e.jsxs("tr",{className:"border-b border-gray-200",children:[e.jsx("td",{className:"py-2 px-2 text-sm",children:r.account_code}),e.jsx("td",{className:"py-2 px-2 text-sm",children:r.account_name}),e.jsx("td",{className:"py-2 px-2 text-sm break-words",children:r.description}),e.jsx("td",{className:"py-2 px-2 text-sm text-right tabular-nums",children:r.debit>0?d(r.debit):"-"}),e.jsx("td",{className:"py-2 px-2 text-sm text-right tabular-nums",children:r.credit>0?d(r.credit):"-"})]},o)),e.jsxs("tr",{className:"border-t-2 border-black",children:[e.jsx("td",{colSpan:3,className:"py-2 px-2 text-sm font-bold",children:t("Total")}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-bold tabular-nums",children:d(s.total_debit)}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-bold tabular-nums",children:d(s.total_credit)})]})]})]})]},s.id)),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[t("Generated on")," ",n(new Date().toISOString())]})})]}),e.jsx("style",{children:`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.25in;
                    size: A4 landscape;
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
