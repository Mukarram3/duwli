import{a3 as l,a0 as e}from"./ui-CUd_MbMF.js";import{X as x,S as h}from"./app-Cl5D7Owg.js";import{a as f}from"./html2pdf-mj3KYEKn.js";import{c as r,j as s,b as i}from"./helpers-D-tx_SVd.js";import{u as b}from"./useTranslation-CarjLPZq.js";function v(){const{t:a}=b(),{profitLoss:n}=x().props,[c,o]=l.useState(!1);l.useEffect(()=>{new URLSearchParams(window.location.search).get("download")==="pdf"&&d()},[]);const d=async()=>{o(!0);const t=document.querySelector(".profit-loss-container");if(t){const m={margin:.25,filename:`profit-loss-${r(n.from_date)}-to-${r(n.to_date)}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"a4",orientation:"portrait"}};try{await f().set(m).from(t).save(),setTimeout(()=>window.close(),1e3)}catch(p){console.error("PDF generation failed:",p)}}o(!1)};return e.jsxs("div",{className:"min-h-screen bg-white",children:[e.jsx(h,{title:a("Profit & Loss Statement")}),c&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",children:e.jsx("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:e.jsxs("div",{className:"flex items-center space-x-3",children:[e.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"}),e.jsx("p",{className:"text-lg font-semibold text-gray-700",children:a("Generating PDF...")})]})})}),e.jsxs("div",{className:"profit-loss-container bg-white max-w-4xl mx-auto p-12",children:[e.jsxs("div",{className:"flex justify-between items-start mb-12",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold mb-4",children:s("company_name")||"YOUR COMPANY"}),e.jsxs("div",{className:"text-sm space-y-1",children:[s("company_address")&&e.jsx("p",{children:s("company_address")}),(s("company_city")||s("company_state")||s("company_zipcode"))&&e.jsxs("p",{children:[s("company_city"),s("company_state")&&`, ${s("company_state")}`," ",s("company_zipcode")]}),s("company_country")&&e.jsx("p",{children:s("company_country")}),s("company_telephone")&&e.jsxs("p",{children:[a("Phone"),": ",s("company_telephone")]}),s("company_email")&&e.jsxs("p",{children:[a("Email"),": ",s("company_email")]})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsx("h2",{className:"text-2xl font-bold mb-2",children:a("PROFIT & LOSS STATEMENT")}),e.jsx("div",{className:"text-sm space-y-1",children:e.jsxs("p",{children:[a("Period"),": ",r(n.from_date)," - ",r(n.to_date)]})})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-8 mb-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-bold border-b-2 border-gray-800 pb-2 mb-3",children:a("Revenue")}),n.revenue.length>0?n.revenue.map(t=>e.jsxs("div",{className:"flex justify-between py-1.5 text-sm",children:[e.jsxs("span",{children:[t.account_code," - ",t.account_name]}),e.jsx("span",{className:"tabular-nums",children:i(t.balance)})]},t.id)):e.jsx("p",{className:"text-sm py-2",children:a("No revenue accounts")}),e.jsxs("div",{className:"flex justify-between py-2 font-semibold text-sm border-t mt-2",children:[e.jsx("span",{children:a("Total Revenue")}),e.jsx("span",{className:"tabular-nums",children:i(n.total_revenue)})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-bold border-b-2 border-gray-800 pb-2 mb-3",children:a("Expenses")}),n.expenses.length>0?n.expenses.map(t=>e.jsxs("div",{className:"flex justify-between py-1.5 text-sm",children:[e.jsxs("span",{children:[t.account_code," - ",t.account_name]}),e.jsx("span",{className:"tabular-nums",children:i(t.balance)})]},t.id)):e.jsx("p",{className:"text-sm py-2",children:a("No expense accounts")}),e.jsxs("div",{className:"flex justify-between py-2 font-semibold text-sm border-t mt-2",children:[e.jsx("span",{children:a("Total Expenses")}),e.jsx("span",{className:"tabular-nums",children:i(n.total_expenses)})]})]})]}),e.jsx("div",{className:"mt-8 pt-4 border-t-2 border-gray-800",children:e.jsxs("div",{className:"flex justify-between py-2 font-bold text-base",children:[e.jsx("span",{children:n.net_profit>=0?a("Net Profit"):a("Net Loss")}),e.jsx("span",{className:"tabular-nums",children:i(Math.abs(n.net_profit))})]})}),e.jsx("div",{className:"mt-12 pt-6 border-t text-center text-sm text-gray-600",children:e.jsxs("p",{children:[a("Generated on")," ",r(new Date().toISOString())]})})]}),e.jsx("style",{children:`
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: Arial, sans-serif;
                }

                @page {
                    margin: 0.25in;
                    size: A4;
                }

                .profit-loss-container {
                    max-width: 100%;
                    margin: 0;
                    box-shadow: none;
                }

                @media print {
                    body {
                        background: white;
                    }

                    .profit-loss-container {
                        box-shadow: none;
                    }
                }
            `})]})}export{v as default};
