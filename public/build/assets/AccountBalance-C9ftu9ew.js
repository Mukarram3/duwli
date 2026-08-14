import{a3 as o,a0 as e}from"./ui-CUd_MbMF.js";import{X as h,S as y}from"./app-C7Sbn7Uw.js";import{a as j}from"./html2pdf-AkmCTqwl.js";import{j as s,c,b as r}from"./helpers-Civi_Qx0.js";import{u}from"./useTranslation-BUHFzdRV.js";function _(){const{t}=u(),{data:l,filters:m}=h().props,[x,d]=o.useState(!1);o.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&p()},[]);const p=async()=>{d(!0);const i=document.querySelector(".report-container");if(i){const n={margin:.25,filename:"account-balance-summary.pdf",image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await j().set(n).from(i).save(),setTimeout(()=>window.close(),1e3)}catch(a){console.error("PDF generation failed:",a)}}d(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(y,{title:t("Account Balance Summary")}),x&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:t("Generating PDF...")})]})})}),e.jsxs("div",{className:"report-container bg-white max-w-5xl mx-auto p-8",children:[e.jsx("div",{className:"border-b-2 border-gray-800 pb-6 mb-8",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900 mb-2",children:s("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm text-gray-600 space-y-0.5",children:[s("company_address")&&e.jsx("p",{children:s("company_address")}),(s("company_city")||s("company_state")||s("company_zipcode"))&&e.jsxs("p",{children:[s("company_city"),s("company_state")&&`, ${s("company_state")}`," ",s("company_zipcode")]}),s("company_country")&&e.jsx("p",{children:s("company_country")})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900 mb-3",children:t("ACCOUNT BALANCE SUMMARY")}),e.jsxs("p",{className:"text-sm text-gray-600",children:[t("As of"),": ",c(m.as_of_date)]})]})]})}),Object.entries(l.grouped).map(([i,n])=>e.jsxs("div",{className:"mb-6 page-break-inside-avoid",children:[e.jsx("h3",{className:"text-base font-bold border-b-2 border-gray-400 pb-1 mb-2",children:t(i)}),e.jsxs("table",{className:"w-full border-collapse mb-4 page-break-inside-avoid",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-black",children:[e.jsx("th",{className:"text-left py-2 px-2 text-sm font-semibold w-24",children:t("Account Code")}),e.jsx("th",{className:"text-left py-2 px-2 text-sm font-semibold",children:t("Account Name")}),e.jsx("th",{className:"text-right py-2 px-2 text-sm font-semibold w-28",children:t("Debit")}),e.jsx("th",{className:"text-right py-2 px-2 text-sm font-semibold w-28",children:t("Credit")}),e.jsx("th",{className:"text-right py-2 px-2 text-sm font-semibold w-32",children:t("Net Balance")})]})}),e.jsxs("tbody",{children:[n.accounts.map((a,b)=>e.jsxs("tr",{className:"border-b border-gray-200",children:[e.jsx("td",{className:"py-2 px-2 text-sm",children:a.account_code}),e.jsx("td",{className:"py-2 px-2 text-sm break-words",children:a.account_name}),e.jsx("td",{className:"py-2 px-2 text-sm text-right tabular-nums",children:a.debit>0?r(a.debit):"-"}),e.jsx("td",{className:"py-2 px-2 text-sm text-right tabular-nums",children:a.credit>0?r(a.credit):"-"}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-medium tabular-nums",children:r(a.net_balance)})]},b)),e.jsxs("tr",{className:"border-t-2 border-gray-400",children:[e.jsxs("td",{colSpan:2,className:"py-2 px-2 text-sm font-bold",children:[t("Subtotal")," - ",t(i)]}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-bold tabular-nums",children:r(n.subtotal_debit)}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-bold tabular-nums",children:r(n.subtotal_credit)}),e.jsx("td",{className:"py-2 px-2 text-sm text-right font-bold tabular-nums",children:r(n.subtotal_net)})]})]})]})]},i)),e.jsx("table",{className:"w-full border-collapse border-t-4 border-black",children:e.jsx("tbody",{children:e.jsxs("tr",{className:"font-bold",children:[e.jsx("td",{colSpan:2,className:"py-3 px-2 text-sm",children:t("GRAND TOTAL")}),e.jsx("td",{className:"py-3 px-2 text-sm text-right tabular-nums w-28",children:r(l.totals.debit)}),e.jsx("td",{className:"py-3 px-2 text-sm text-right tabular-nums w-28",children:r(l.totals.credit)}),e.jsx("td",{className:"py-3 px-2 text-sm text-right tabular-nums w-32",children:r(l.totals.net)})]})})}),e.jsx("div",{className:"mt-8 pt-4 border-t text-center text-xs text-gray-600",children:e.jsxs("p",{children:[t("Generated on")," ",c(new Date().toISOString())]})})]}),e.jsx("style",{children:`
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
