import{s as h}from"./index-Cfyb-cTT.js";import{f as i}from"./emailUtils-C-rUDXQT.js";const r=async s=>{try{if(!s.to||s.to.length===0)return{success:!1,error:"Recipient list cannot be empty.",message:"Không thể gửi email: Danh sách người nhận trống."};console.log("Sending email via Edge Function:",s);const{data:n,error:t}=await h.functions.invoke("send-notification-email",{body:s});return console.log("Edge Function response:",{data:n,error:t}),t?(console.error("Edge Function invocation error details:",t),{success:!1,error:`Lỗi gửi email từ Edge Function: ${t.message||JSON.stringify(t)}`,message:"Không thể gửi email"}):n&&!n.success?(console.error("Email service error:",n),{success:!1,error:`Lỗi từ dịch vụ email: ${n.error||"Lỗi không xác định"}`,message:n.message||"Không thể gửi email",data:n}):(console.log("Email sent successfully:",n),{success:!0,data:n,message:"Email đã được gửi thành công"})}catch(n){return console.error("Error in sendEmail:",n),{success:!1,error:n instanceof Error?n.message:"Lỗi không xác định",message:"Không thể gửi email"}}},c=async(s,n,t)=>{const e=`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a; text-align: center;">Thông báo Tài sản</h2>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${t}
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Đây là email tự động từ hệ thống Thông báo TS
      </p>
    </div>
  `;return await r({to:s,subject:n,html:e,type:"asset_notification"})},d=async s=>{const n=i(s),t="Test Email - Thông báo TS",e=`
    <h3>Email Test Thành Công</h3>
    <p>Đây là email test từ hệ thống Thông báo TS.</p>
    <p><strong>Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
    <p><strong>Người nhận:</strong> ${n}</p>
    <p style="color: #16a34a; font-weight: bold;">Hệ thống email hoạt động bình thường.</p>
  `;return await c([n],t,e)},f=async(s,n,t)=>{const e=i(s);{const a="Xác nhận thông báo tài sản thành công",g=`
      <h3>Thông báo tài sản đã được ghi nhận thành công</h3>
      <p>Các tài sản sau đã được ghi nhận:</p>
      ${n.map(o=>`
      <p><strong>Mã tài sản:</strong> ${o.asset_code}.${o.asset_year}</p>
      ${o.note?`<p><strong>Ghi chú:</strong> ${o.note}</p>`:""}
      <hr style="border: none; border-top: 1px solid #eee; margin: 10px 0;">
    `).join("")}
      <p><strong>Mã nhân viên:</strong> ${n[0].staff_code}</p>
      <p><strong>Ngày giao dịch:</strong> ${n[0].transaction_date}</p>
      <p><strong>Buổi:</strong> ${n[0].parts_day}</p>
      <p><strong>Phòng:</strong> ${n[0].room}</p>
      <p><strong>Loại giao dịch:</strong> ${n[0].transaction_type}</p>
      <p style="color: #16a34a; font-weight: bold;">Thông báo đã được lưu vào hệ thống thành công.</p>
    `;return await c([e],a,g)}},u=async(s,n,t)=>{const e=`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff9800; text-align: center;">Nhắc nhở Tài sản đến hạn</h2>
      <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${t}
      </div>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Đây là email tự động từ hệ thống Nhắc nhở Tài sản
      </p>
    </div>
  `;return await r({to:s,subject:n,html:e,type:"asset_reminder"})};export{u as a,c as b,f as s,d as t};
