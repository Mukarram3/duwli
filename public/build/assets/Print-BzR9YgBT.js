import{a3 as c,a0 as e}from"./ui-CUd_MbMF.js";import{X as h,S as p}from"./app-i8mP51xC.js";import{a as b}from"./html2pdf-C8EgMg_q.js";import{c as n,j as t,b as i}from"./helpers-BjzW7Amb.js";import{u as y}from"./useTranslation-D25PfAzW.js";function w(){const{t:a}=y(),{trialBalance:r}=h().props,[o,l]=c.useState(!1);c.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&d()},[]);const d=async()=>{l(!0);const s=document.querySelector(".trial-balance-container");if(s){const m={margin:.25,filename:`trial-balance-${n(r.from_date)}-to-${n(r.to_date)}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await b().set(m).from(s).save(),setTimeout(()=>window.close(),1e3)}catch(x){console.error("PDF generation failed:",x)}}l(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(p,{title:a("Trial Balance")}),o&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:a("Generating PDF...")})]})})}),e.jsxs("div",{className:"trial-balance-container bg-white max-w-4xl mx-auto p-12",children:[e.jsxs("div",{className:"flex justify-between items-start mb-12",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold mb-4",children:t("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm space-y-1",children:[t("company_address")&&e.jsx("p",{children:t("company_address")}),(t("company_city")||t("company_state")||t("company_zipcode"))&&e.jsxs("p",{children:[t("company_city"),t("company_state")&&`, ${t("company_state")}`," ",t("company_zipcode")]}),t("company_country")&&e.jsx("p",{children:t("company_country")}),t("company_telephone")&&e.jsxs("p",{children:[a("Phone"),": ",t("company_telephone")]}),t("company_email")&&e.jsxs("p",{children:[a("Email"),": ",t("company_email")]})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold mb-2",children:a("TRIAL BALANCE")}),e.jsx("div",{className:"text-sm space-y-1",children:e.jsxs("p",{children:[a("Period"),": ",n(r.from_date)," - ",n(r.to_date)]})})]})]}),e.jsx("div",{className:"mb-6",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b-2 border-gray-800",children:[e.jsx("th",{className:"text-left py-2 text-sm font-bold",children:a("Account Code")}),e.jsx("th",{className:"text-left py-2 text-sm font-bold",children:a("Account Name")}),e.jsx("th",{className:"text-right py-2 text-sm font-bold",children:a("Debit")}),e.jsx("th",{className:"text-right py-2 text-sm font-bold",children:a("Credit")})]})}),e.jsx("tbody",{children:r.accounts.map(s=>e.jsxs("tr",{className:"border-b border-gray-100",children:[e.jsx("td",{className:"py-1.5 text-sm",children:s.account_code}),e.jsx("td",{className:"py-1.5 text-sm",children:s.account_name}),e.jsx("td",{className:"py-1.5 text-sm text-right tabular-nums",children:s.debit>0?i(s.debit):"-"}),e.jsx("td",{className:"py-1.5 text-sm text-right tabular-nums",children:s.credit>0?i(s.credit):"-"})]},s.id))}),e.jsx("tfoot",{children:e.jsxs("tr",{className:"border-t-2 border-gray-800",children:[e.jsx("td",{colSpan:2,className:"py-2 text-sm font-bold",children:a("TOTAL")}),e.jsx("td",{className:"py-2 text-sm text-right font-bold tabular-nums",children:i(r.total_debit)}),e.jsx("td",{className:"py-2 text-sm text-right font-bold tabular-nums",children:i(r.total_credit)})]})})]})}),e.jsx("div",{className:"mt-12 pt-6 border-t text-center text-sm text-gray-600",children:e.jsxs("p",{children:[a("Generated on")," ",n(new Date().toISOString())]})})]}),e.jsx("style",{children:`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.25in;
                    size: A4;
                }

                .trial-balance-container {
                    max-width: 100%;
                    margin: 0;
                    box-shadow: none;
                }

                @media print {
                    body {
                        background: white;
                    }

                    .trial-balance-container {
                        box-shadow: none;
                    }
                }
            `})]})}export{w as default};
