import{a as v}from"./html2pdf-DUhNcNym.js";import{c as f,b as n}from"./helpers-Bcr036ZC.js";import"./ui-CUd_MbMF.js";import"./jspdf.es.min-BQPRd_WH.js";import"./app-BATZf2i0.js";const l=async(s,a)=>{var r;const c=`
        <div class="receipt">
            <div class="header">
                <div class="company-name">${(a==null?void 0:a.company_name)||"COMPANY NAME"}</div>
                <div class="company-info">
                    ${(a==null?void 0:a.company_address)||"Company Address"}<br>
                    ${(a==null?void 0:a.company_city)||"City"}, ${(a==null?void 0:a.company_state)||"State"}<br>
                    ${(a==null?void 0:a.company_country)||"Country"} - ${(a==null?void 0:a.company_zipcode)||"Zipcode"}
                </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="receipt-info">
                <div class="info-row">
                    <span>Receipt No:</span>
                    <span>${s.pos_number}</span>
                </div>
                <div class="info-row">
                    <span>Date:</span>
                    <span>${f(new Date)}</span>
                </div>
                <div class="info-row">
                    <span>Time:</span>
                    <span>${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="info-row">
                    <span>Customer:</span>
                    <span>${((r=s.customer)==null?void 0:r.name)||"Walk-in Customer"}</span>
                </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="items-section">
                ${s.items.map(i=>{const d=i.price*i.quantity;let o=0,p="";return i.taxes&&i.taxes.length>0?p=i.taxes.map(e=>(o+=d*e.rate/100,`${e.name} (${e.rate}%)`)).join(", "):p="No Tax",`
                        <div class="item">
                            <div class="item-name">${i.name}</div>
                            <div class="item-details">
                                <div class="total-row">
                                    <span>Qty: ${i.quantity}</span>
                                    <span>Price: ${n(i.price)}</span>
                                </div>
                                <div class="total-row">
                                    <span>Tax: ${p}</span>
                                    <span>Tax Amount: ${n(o)}</span>
                                </div>
                                <div class="total-row" style="font-weight: bold;">
                                    <span>Subtotal:</span>
                                    <span>${n(d+o)}</span>
                                </div>
                            </div>
                        </div>
                    `}).join("")}
            </div>
            
            <div class="separator"></div>
            
            <div class="totals">
                <div class="total-row">
                    <span>Discount:</span>
                    <span>-${n(s.discount)}</span>
                </div>
                <div class="final-total">
                    <span>TOTAL:</span>
                    <span>${n(s.total)}</span>
                </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="footer">
                <div style="font-weight: bold;">*** THANK YOU ***</div>
                <div>Visit Again!</div>
            </div>
        </div>
        
        <style>
            .receipt { max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .company-info { font-size: 12px; line-height: 1.4; }
            .separator { border-top: 1px dashed #000; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .item { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dotted #ccc; }
            .item-name { font-weight: bold; margin-bottom: 8px; }
            .item-details { font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .final-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
    `,t=document.createElement("div");t.innerHTML=c,document.body.appendChild(t);const m={margin:.1,filename:`receipt-${s.pos_number}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"mm",format:[80,297],orientation:"portrait"}};try{await v().set(m).from(t).save()}catch(i){console.error("PDF generation failed:",i)}finally{document.body.removeChild(t)}};export{l as downloadReceiptPDF};
