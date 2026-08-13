<?php

namespace Workdo\Lead\Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\EmailTemplateLang;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class EmailTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $admin = User::where('type','company')->first();

        $emailTemplate = [
            'Lead Assign',
            'Lead Move',

            'Deal Assign',
            'Deal Move',
            
            'Lead Emails',
            'Deal Emails',
        ];
        $defaultTemplate = [
            'Lead Assign' => [
                'subject' => 'Lead Assigned',
                'variables' => '{
                    "App Name": "app_name",
                    "App Url": "app_url",
                    "Company Name": "company_name",
                    "Lead Name": "lead_name",
                    "Lead Email": "lead_email",
                    "Lead Pipeline": "lead_pipeline",
                    "Lead Stage": "lead_stage"
                }',
                'lang' => [
                    'ar' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 تم إنشاء عميل محتمل جديد بنجاح
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    أخبار رائعة! تمت إضافة عميل محتمل جديد إلى نظام إدارة علاقات العملاء الخاص بك. 🚀
                    </p>

                    <p>
                    فيما يلي تفاصيل العميل المحتمل الذي تم إنشاؤه حديثًا:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>اسم العميل المحتمل:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>البريد الإلكتروني:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>الموضوع:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>خط الأنابيب:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>المرحلة:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>تاريخ المتابعة:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    تأكد من المتابعة في الوقت المحدد واستمر في التواصل لتحويل هذه الفرصة إلى صفقة ناجحة. 💼
                    </p>

                    <p>
                    نتمنى لك كل التوفيق مع هذا العميل المحتمل! ✨
                    </p>

                    <p style="margin-top:25px;">
                    مع أطيب التحيات،<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'da' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nyt lead er oprettet
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Gode nyheder! Et nyt lead er blevet tilføjet til dit CRM-system. 🚀
                    </p>

                    <p>
                    Her er detaljerne for det nyoprettede lead:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Lead navn:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Email adresse:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Emne:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Fase:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Opfølgningsdato:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Sørg for at følge op i tide og fortsæt dialogen for at omdanne denne mulighed til en succesfuld aftale. 💼
                    </p>

                    <p>
                    Vi ønsker dig stor succes med dette lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Med venlig hilsen,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'de' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Neuer Lead erfolgreich erstellt
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Großartige Neuigkeiten! Ein neuer Lead wurde zu Ihrem CRM hinzugefügt. 🚀
                    </p>

                    <p>
                    Hier sind die Details des neu erstellten Leads:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Lead Name:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>E-Mail-Adresse:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Betreff:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Phase:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Follow-Up Datum:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Stellen Sie sicher, dass Sie rechtzeitig nachfassen und das Gespräch fortsetzen, um diese Chance in einen erfolgreichen Abschluss umzuwandeln. 💼
                    </p>

                    <p>
                    Wir wünschen Ihnen viel Erfolg mit diesem Lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Mit freundlichen Grüßen,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'en' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 New Lead Created Successfully
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Great news! A new lead has been added to your CRM. 🚀
                    </p>

                    <p>
                    Here are the details of the newly created lead:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Lead Name:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Email Address:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Subject:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Stage:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Follow-Up Date:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Make sure to follow up on time and keep the conversation going to convert this opportunity into a successful deal. 💼
                    </p>

                    <p>
                    Wishing you great success with this lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Best Regards,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'es' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nuevo lead creado con éxito
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    ¡Grandes noticias! Se ha añadido un nuevo lead a tu CRM. 🚀
                    </p>

                    <p>
                    Aquí están los detalles del nuevo lead creado:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nombre del lead:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Correo electrónico:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Asunto:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Etapa:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Fecha de seguimiento:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Asegúrate de hacer el seguimiento a tiempo y continuar la conversación para convertir esta oportunidad en un acuerdo exitoso. 💼
                    </p>

                    <p>
                    ¡Te deseamos mucho éxito con este lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Saludos cordiales,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'fr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nouveau prospect créé avec succès
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Excellente nouvelle ! Un nouveau prospect a été ajouté à votre CRM. 🚀
                    </p>

                    <p>
                    Voici les détails du prospect nouvellement créé :
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nom du prospect :</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Adresse e-mail :</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Sujet :</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline :</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Étape :</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Date de suivi :</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Assurez-vous de faire un suivi à temps et de poursuivre la conversation afin de transformer cette opportunité en une affaire réussie. 💼
                    </p>

                    <p>
                    Nous vous souhaitons beaucoup de succès avec ce prospect ! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Cordialement,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'it' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nuovo lead creato con successo
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Ottime notizie! Un nuovo lead è stato aggiunto al tuo CRM. 🚀
                    </p>

                    <p>
                    Ecco i dettagli del lead appena creato:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nome lead:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Indirizzo email:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Oggetto:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Fase:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Data di follow-up:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Assicurati di effettuare il follow-up in tempo e continua la conversazione per trasformare questa opportunità in un accordo di successo. 💼
                    </p>

                    <p>
                    Ti auguriamo grande successo con questo lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Cordiali saluti,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'ja' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 新しいリードが正常に作成されました
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    素晴らしいお知らせです！新しいリードがCRMに追加されました。🚀
                    </p>

                    <p>
                    新しく作成されたリードの詳細は以下の通りです：
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>リード名:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>メールアドレス:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>件名:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>パイプライン:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>ステージ:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>フォローアップ日:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    適切なタイミングでフォローアップを行い、会話を続けてこの機会を成功する取引へとつなげてください。💼
                    </p>

                    <p>
                    このリードでの成功をお祈りしています！✨
                    </p>

                    <p style="margin-top:25px;">
                    よろしくお願いいたします。<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'nl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nieuwe lead succesvol aangemaakt
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Goed nieuws! Er is een nieuwe lead toegevoegd aan je CRM. 🚀
                    </p>

                    <p>
                    Hier zijn de details van de nieuw aangemaakte lead:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Lead naam:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>E-mailadres:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Onderwerp:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Fase:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Follow-up datum:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Zorg ervoor dat je op tijd opvolgt en het gesprek voortzet om deze kans om te zetten in een succesvolle deal. 💼
                    </p>

                    <p>
                    We wensen je veel succes met deze lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Met vriendelijke groet,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'pl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Nowy lead został pomyślnie utworzony
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Świetna wiadomość! Nowy lead został dodany do Twojego CRM. 🚀
                    </p>

                    <p>
                    Oto szczegóły nowo utworzonego leada:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nazwa leada:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Adres e-mail:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Temat:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Etap:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Data follow-up:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Upewnij się, że wykonasz follow-up na czas i kontynuuj rozmowę, aby zamienić tę okazję w udaną transakcję. 💼
                    </p>

                    <p>
                    Życzymy Ci powodzenia z tym leadem! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Z poważaniem,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                    'ru' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Новый лид успешно создан
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Отличные новости! Новый лид был добавлен в вашу CRM. 🚀
                    </p>

                    <p>
                    Вот детали нового лида:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Имя лида:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Электронная почта:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Тема:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Воронка:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Этап:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Дата последующего контакта:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Обязательно выполните последующее действие вовремя и продолжайте общение, чтобы превратить эту возможность в успешную сделку. 💼
                    </p>

                    <p>
                    Желаем вам большого успеха с этим лидом! ✨
                    </p>

                    <p style="margin-top:25px;">
                    С уважением,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                   'pt' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Novo lead criado com sucesso
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Ótimas notícias! Um novo lead foi adicionado ao seu CRM. 🚀
                    </p>

                    <p>
                    Aqui estão os detalhes do lead recém-criado:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nome do lead:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Endereço de e-mail:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Assunto:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Etapa:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Data de follow-up:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Certifique-se de fazer o acompanhamento no tempo certo e continue a conversa para transformar esta oportunidade em um negócio bem-sucedido. 💼
                    </p>

                    <p>
                    Desejamos muito sucesso com este lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Atenciosamente,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pt-BR' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Novo lead criado com sucesso
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Ótimas notícias! Um novo lead foi adicionado ao seu CRM. 🚀
                    </p>

                    <p>
                    Aqui estão os detalhes do lead recém-criado:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Nome do lead:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>Endereço de e-mail:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Assunto:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Etapa:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Data de follow-up:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Certifique-se de fazer o acompanhamento no tempo certo e continue a conversa para transformar esta oportunidade em um negócio bem-sucedido. 💼
                    </p>

                    <p>
                    Desejamos muito sucesso com este lead! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Atenciosamente,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'he' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 ליד חדש נוצר בהצלחה
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    חדשות נהדרות! ליד חדש נוסף למערכת ה-CRM שלך. 🚀
                    </p>

                    <p>
                    להלן פרטי הליד שנוצר:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>שם הליד:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>אימייל:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>נושא:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>שלב:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>תאריך מעקב:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    ודא לבצע מעקב בזמן ולהמשיך את השיחה כדי להפוך את ההזדמנות הזו לעסקה מוצלחת. 💼
                    </p>

                    <p>
                    מאחלים לך הצלחה רבה עם הליד הזה! ✨
                    </p>

                    <p style="margin-top:25px;">
                    בברכה,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'tr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 Yeni müşteri adayı başarıyla oluşturuldu
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    Harika haber! CRM sisteminize yeni bir müşteri adayı eklendi. 🚀
                    </p>

                    <p>
                    Yeni oluşturulan müşteri adayının detayları aşağıdadır:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>Müşteri adayı adı:</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>E-posta adresi:</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>Konu:</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>Pipeline:</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>Aşama:</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>Takip tarihi:</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    Bu fırsatı başarılı bir anlaşmaya dönüştürmek için zamanında takip etmeyi ve iletişimi sürdürmeyi unutmayın. 💼
                    </p>

                    <p>
                    Bu müşteri adayı ile büyük başarılar dileriz! ✨
                    </p>

                    <p style="margin-top:25px;">
                    Saygılarımızla,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',

                    'zh' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#4f46e5,#6366f1);color:#ffffff;padding:26px 30px;font-size:22px;font-weight:600;">
                    🎉 新潜在客户创建成功
                    </div>

                    <div style="padding:30px;color:#374151;font-size:15px;line-height:1.7;">

                    <p style="font-size:16px;margin-top:0;">
                    好消息！一个新的潜在客户已经添加到您的 CRM 系统中。🚀
                    </p>

                    <p>
                    以下是新创建潜在客户的详细信息：
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:20px 0;">

                    <p style="margin:6px 0;"><strong>潜在客户姓名：</strong> {lead_name}</p>
                    <p style="margin:6px 0;"><strong>电子邮箱：</strong> {lead_email}</p>
                    <p style="margin:6px 0;"><strong>主题：</strong> {lead_subject}</p>
                    <p style="margin:6px 0;"><strong>销售管道：</strong> {lead_pipeline}</p>
                    <p style="margin:6px 0;"><strong>阶段：</strong> {lead_stage}</p>
                    <p style="margin:6px 0;"><strong>跟进日期：</strong> {follow_up_date}</p>

                    </div>

                    <p>
                    请确保按时跟进，并继续沟通，将这个机会转化为成功的交易。💼
                    </p>

                    <p>
                    祝您在这个潜在客户上取得巨大成功！✨
                    </p>

                    <p style="margin-top:25px;">
                    此致敬礼，<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>
                    </div>
                    </div>',
                ],
            ],

            'Lead Move' => [
                'subject' => 'Lead has been Moved',
                'variables' => '{
                    "App Url": "app_url",
                    "App Name": "app_name",
                    "Company Name ":"company_name",
                    "Lead Name": "lead_name",
                    "Lead Email": "lead_email",
                    "Lead Pipeline": "lead_pipeline",
                    "Lead Old Stage": "lead_old_stage",
                    "Lead New Stage": "lead_new_stage"
                  }',
                'lang' => [
                    'ar' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 تم تحديث مرحلة العميل المحتمل</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">تم نقل عميل محتمل إلى مرحلة جديدة في مسار المبيعات</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    مرحباً،
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    خبر رائع! تقدم العميل المحتمل <strong>{lead_name}</strong> في مسار المبيعات الخاص بك.
                    تم تحديث المرحلة بنجاح.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>اسم العميل المحتمل:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>البريد الإلكتروني:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>مسار المبيعات:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>المرحلة السابقة:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>المرحلة الجديدة:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    عرض العميل في {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    استمر في التقدم وتحويل الفرص إلى نجاح! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',

                    'da' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Lead-fase opdateret</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Et lead er blevet flyttet til en ny fase i din pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Hej,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Gode nyheder! Leadet <strong>{lead_name}</strong> er rykket frem i din salgspipeline.
                    Fasen er blevet opdateret med succes.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead navn:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead e-mail:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Tidligere fase:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Ny fase:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Se lead i {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Bliv ved med at skabe fremgang og omdanne muligheder til succes! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',

                    'de' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Lead-Phase aktualisiert</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Ein Lead wurde in eine neue Phase Ihrer Pipeline verschoben</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Großartige Neuigkeiten! Der Lead <strong>{lead_name}</strong> ist in Ihrer Vertriebspipeline vorangekommen.
                    Die Phase wurde erfolgreich aktualisiert.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead Name:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead E-Mail:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Vorherige Phase:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Neue Phase:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Lead in {app_name} ansehen
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Machen Sie weiter so und verwandeln Sie Chancen in Erfolg! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',

                    'en' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Lead Stage Updated</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">A lead has moved to a new stage in your pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Hello,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Great news! The lead <strong>{lead_name}</strong> has progressed in your sales pipeline.
                    The stage has been successfully updated.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead Name:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead Email:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Previous Stage:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>New Stage:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    View Lead in {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Keep moving forward and converting opportunities into success! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',

                    'es' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Etapa del lead actualizada</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Un lead se ha movido a una nueva etapa en tu pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Hola,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    ¡Buenas noticias! El lead <strong>{lead_name}</strong> ha avanzado en tu pipeline de ventas.
                    La etapa se ha actualizado correctamente.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nombre del Lead:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email del Lead:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Etapa anterior:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nueva etapa:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Ver lead en {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    ¡Sigue avanzando y convirtiendo oportunidades en éxito! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',

                    'fr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Étape du lead mise à jour</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Un lead a été déplacé vers une nouvelle étape dans votre pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Bonjour,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Bonne nouvelle ! Le lead <strong>{lead_name}</strong> a progressé dans votre pipeline de vente.
                    L’étape a été mise à jour avec succès.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nom du lead :</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email du lead :</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline :</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Étape précédente :</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nouvelle étape :</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Voir le lead dans {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Continuez à avancer et à transformer les opportunités en succès ! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'it' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Fase del lead aggiornata</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Un lead è stato spostato a una nuova fase nella tua pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Ciao,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Ottime notizie! Il lead <strong>{lead_name}</strong> è avanzato nella tua pipeline di vendita.
                    La fase è stata aggiornata con successo.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nome lead:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email lead:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Fase precedente:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nuova fase:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Visualizza lead in {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Continua ad andare avanti e a trasformare le opportunità in successo! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'ja' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 リードステージが更新されました</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">リードがパイプラインの新しいステージに移動しました</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    こんにちは、
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    朗報です！リード <strong>{lead_name}</strong> があなたのセールスパイプラインで進展しました。
                    ステージが正常に更新されました。
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>リード名:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>リードメール:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>パイプライン:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>以前のステージ:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>新しいステージ:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    {app_name} でリードを見る
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    前進し続け、チャンスを成功に変えましょう！ 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'nl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Leadfase bijgewerkt</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Een lead is verplaatst naar een nieuwe fase in je pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Goed nieuws! De lead <strong>{lead_name}</strong> is verder gegaan in je verkoop-pipeline.
                    De fase is succesvol bijgewerkt.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead naam:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Lead e-mail:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Vorige fase:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nieuwe fase:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Bekijk lead in {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Blijf vooruitgaan en zet kansen om in succes! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'pl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Etap leada zaktualizowany</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Lead został przeniesiony do nowego etapu w Twoim pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Witaj,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Świetna wiadomość! Lead <strong>{lead_name}</strong> zrobił postęp w Twoim pipeline sprzedaży.
                    Etap został pomyślnie zaktualizowany.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nazwa leada:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email leada:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Poprzedni etap:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nowy etap:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Zobacz lead w {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Kontynuuj działania i zamieniaj możliwości w sukces! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'ru' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Этап лида обновлён</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Лид был перемещён на новый этап в вашей воронке</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Здравствуйте,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Отличные новости! Лид <strong>{lead_name}</strong> продвинулся в вашей воронке продаж.
                    Этап был успешно обновлён.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Имя лида:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email лида:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Воронка:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Предыдущий этап:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Новый этап:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Посмотреть лид в {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Продолжайте двигаться вперёд и превращать возможности в успех! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                    'pt' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                    <h2 style="margin:0;font-size:22px;">🚀 Etapa do lead atualizada</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Um lead foi movido para uma nova etapa no seu pipeline</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                    Boas notícias! O lead <strong>{lead_name}</strong> avançou no seu pipeline de vendas.
                    A etapa foi atualizada com sucesso.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nome do lead:</strong> {lead_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Email do lead:</strong> {lead_email}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {lead_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Etapa anterior:</strong> {lead_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nova etapa:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                    </p>

                    </div>

                    <div style="text-align:center;margin-bottom:20px;">
                    <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Ver lead em {app_name}
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Continue avançando e transformando oportunidades em sucesso! 🎯
                    </p>

                    </div>
                    </div>
                    </div>',
                                            'pt-BR' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                        <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                        <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                        <h2 style="margin:0;font-size:22px;">🚀 Etapa do lead atualizada</h2>
                        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Um lead foi movido para uma nova etapa no seu pipeline</p>
                        </div>

                        <div style="padding:30px;">

                        <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                        Olá,
                        </p>

                        <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                        Boas notícias! O lead <strong>{lead_name}</strong> avançou no seu pipeline de vendas.
                        A etapa foi atualizada com sucesso.
                        </p>

                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Nome do lead:</strong> {lead_name}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Email do lead:</strong> {lead_email}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Pipeline:</strong> {lead_pipeline}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Etapa anterior:</strong> {lead_old_stage}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Nova etapa:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                        </p>

                        </div>

                        <div style="text-align:center;margin-bottom:20px;">
                        <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                        Ver lead em {app_name}
                        </a>
                        </div>

                        <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                        Continue avançando e transformando oportunidades em sucesso! 🎯
                        </p>

                        </div>
                        </div>
                        </div>',
                        'he' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                        <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                        <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                        <h2 style="margin:0;font-size:22px;">🚀 שלב הליד עודכן</h2>
                        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">ליד הועבר לשלב חדש בצינור המכירות שלך</p>
                        </div>

                        <div style="padding:30px;">

                        <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                        שלום,
                        </p>

                        <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                        חדשות טובות! הליד <strong>{lead_name}</strong> התקדם בצינור המכירות שלך.
                        השלב עודכן בהצלחה.
                        </p>

                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>שם הליד:</strong> {lead_name}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>אימייל הליד:</strong> {lead_email}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Pipeline:</strong> {lead_pipeline}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>שלב קודם:</strong> {lead_old_stage}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>שלב חדש:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                        </p>

                        </div>

                        <div style="text-align:center;margin-bottom:20px;">
                        <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                        צפה בליד ב-{app_name}
                        </a>
                        </div>

                        <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                        המשך להתקדם ולהפוך הזדמנויות להצלחה! 🎯
                        </p>

                        </div>
                        </div>
                        </div>',

                        'tr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                        <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                        <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                        <h2 style="margin:0;font-size:22px;">🚀 Lead Aşaması Güncellendi</h2>
                        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Bir lead satış hattınızda yeni bir aşamaya taşındı</p>
                        </div>

                        <div style="padding:30px;">

                        <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                        Merhaba,
                        </p>

                        <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                        Harika bir haber! <strong>{lead_name}</strong> adlı lead satış hattınızda ilerledi.
                        Aşama başarıyla güncellendi.
                        </p>

                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Lead Adı:</strong> {lead_name}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Lead E-posta:</strong> {lead_email}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Pipeline:</strong> {lead_pipeline}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Önceki Aşama:</strong> {lead_old_stage}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>Yeni Aşama:</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                        </p>

                        </div>

                        <div style="text-align:center;margin-bottom:20px;">
                        <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                        {app_name} içinde lead\i görüntüle
                        </a>
                        </div>

                        <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                        İlerlemeye devam edin ve fırsatları başarıya dönüştürün! 🎯
                        </p>

                        </div>
                        </div>
                        </div>',

                        'zh' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                        <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                        <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#ffffff;padding:26px 30px;">
                        <h2 style="margin:0;font-size:22px;">🚀 线索阶段已更新</h2>
                        <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">一个线索已移动到您的销售管道中的新阶段</p>
                        </div>

                        <div style="padding:30px;">

                        <p style="font-size:15px;color:#374151;margin-bottom:20px;">
                        您好，
                        </p>

                        <p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:25px;">
                        好消息！线索 <strong>{lead_name}</strong> 在您的销售管道中取得了进展。
                        阶段已成功更新。
                        </p>

                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:25px;">

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>线索名称：</strong> {lead_name}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>线索邮箱：</strong> {lead_email}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>销售管道：</strong> {lead_pipeline}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>之前阶段：</strong> {lead_old_stage}
                        </p>

                        <p style="margin:8px 0;font-size:14px;color:#374151;">
                        <strong>新阶段：</strong> <span style="color:#6366f1;font-weight:600;">{lead_new_stage}</span>
                        </p>

                        </div>

                        <div style="text-align:center;margin-bottom:20px;">
                        <a href="{app_url}" style="background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                        在 {app_name} 中查看线索
                        </a>
                        </div>

                        <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                        继续前进，将机会转化为成功！ 🎯
                        </p>

                        </div>
                        </div>
                        </div>',
                ],
            ],

            'Deal Assign' => [
                'subject' => 'Deal Assigned',
                'variables' => '{
                    "App Url": "app_url",
                    "App Name": "app_name",
                    "Company Name ":"company_name",
                    "Deal Name": "deal_name",
                    "Deal Pipeline": "deal_pipeline",
                    "Deal Stage": "deal_stage",
                    "Deal Status": "deal_status",
                    "Deal Price": "deal_price"
                  }',
                'lang' => [
                    'ar' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 تم إنشاء صفقة جديدة</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">تم إنشاء صفقة جديدة بنجاح.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">مرحباً،</p>

                    <p style="font-size:15px;color:#374151;">
                    يسعدنا إبلاغك بأنه تم إنشاء صفقة جديدة بنجاح في <strong>{app_name}</strong>.
                    فيما يلي تفاصيل الصفقة:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>اسم الصفقة:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>خط الصفقة:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>المرحلة:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>الحالة:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>سعر الصفقة:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    يمكنك عرض هذه الصفقة وإدارتها في أي وقت من لوحة التحكم الخاصة بك.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    عرض الصفقة
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، فلا تتردد في التواصل مع فريق الدعم لدينا.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    مع التحية،<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    مشغل بواسطة {app_name}
                    </div>

                    </div>
                    </div>',

                    'da' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Ny aftale oprettet</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">En ny aftale er blevet oprettet.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">Hej,</p>

                    <p style="font-size:15px;color:#374151;">
                    Vi er glade for at informere dig om, at en ny aftale er blevet oprettet i <strong>{app_name}</strong>.
                    Her er detaljerne om aftalen:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Aftalenavn:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Fase:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Aftalepris:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Du kan se og administrere denne aftale når som helst fra dit dashboard.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Se aftale
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Hvis du har spørgsmål eller har brug for hjælp, er du velkommen til at kontakte vores supportteam.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Med venlig hilsen,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Drevet af {app_name}
                    </div>

                    </div>
                    </div>',

                    'de' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Neuer Deal erstellt</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Ein neuer Deal wurde erfolgreich erstellt.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">Hallo,</p>

                    <p style="font-size:15px;color:#374151;">
                    Wir freuen uns, Ihnen mitzuteilen, dass ein neuer Deal erfolgreich in <strong>{app_name}</strong> erstellt wurde.
                    Nachfolgend finden Sie die Details des Deals:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Deal-Name:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Phase:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Deal-Preis:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Sie können diesen Deal jederzeit über Ihr Dashboard anzeigen und verwalten.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Deal anzeigen
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Wenn Sie Fragen haben oder Unterstützung benötigen, wenden Sie sich bitte an unser Support-Team.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Mit freundlichen Grüßen,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Bereitgestellt von {app_name}
                    </div>

                    </div>
                    </div>',

                    'en' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 New Deal Created</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">A new deal has been successfully created.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hello,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    We are excited to inform you that a new deal has been successfully created in <strong>{app_name}</strong>.
                    Below are the details of the deal:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Deal Name:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Stage:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Deal Price:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    You can view and manage this deal anytime from your dashboard.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    View Deal
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    If you have any questions or need assistance, feel free to contact our support team.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Best Regards,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Powered by {app_name}
                    </div>

                    </div>
                    </div>',

                    'es' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Nuevo trato creado</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Se ha creado un nuevo trato con éxito.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">Hola,</p>

                    <p style="font-size:15px;color:#374151;">
                    Nos complace informarte que se ha creado un nuevo trato en <strong>{app_name}</strong>.
                    A continuación se muestran los detalles del trato:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nombre del trato:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Etapa:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Estado:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Precio del trato:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Puedes ver y administrar este trato en cualquier momento desde tu panel.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Ver trato
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Saludos cordiales,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Desarrollado por {app_name}
                    </div>

                    </div>
                    </div>',


                    'fr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Nouvelle affaire créée</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Une nouvelle affaire a été créée avec succès.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Bonjour,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Nous sommes ravis de vous informer qu\'une nouvelle affaire a été créée avec succès dans <strong>{app_name}</strong>.
                    Voici les détails de l\'affaire :
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nom de l\'affaire :</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline :</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Étape :</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Statut :</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Prix de l\'affaire :</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Vous pouvez consulter et gérer cette affaire à tout moment depuis votre tableau de bord.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Voir l\'affaire
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Si vous avez des questions ou besoin d\'aide, n\'hésitez pas à contacter notre équipe de support.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Cordialement,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Propulsé par {app_name}
                    </div>

                    </div>
                    </div>',


                    'it' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Nuovo affare creato</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Un nuovo affare è stato creato con successo.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Ciao,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Siamo lieti di informarti che un nuovo affare è stato creato con successo in <strong>{app_name}</strong>.
                    Di seguito trovi i dettagli dell\'affare:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nome affare:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Fase:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Stato:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Prezzo affare:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Puoi visualizzare e gestire questo affare in qualsiasi momento dal tuo pannello di controllo.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Visualizza affare
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Se hai domande o hai bisogno di assistenza, non esitare a contattare il nostro team di supporto.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Cordiali saluti,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Offerto da {app_name}
                    </div>

                    </div>
                    </div>',


                    'ja' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 新しい取引が作成されました</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">新しい取引が正常に作成されました。</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    こんにちは、
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    <strong>{app_name}</strong> にて新しい取引が正常に作成されたことをお知らせいたします。  
                    以下は取引の詳細です：
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>取引名:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>パイプライン:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>ステージ:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>ステータス:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>取引価格:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    ダッシュボードからいつでもこの取引を確認・管理できます。
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    取引を見る
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    ご不明な点がございましたら、サポートチームまでお気軽にお問い合わせください。
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    よろしくお願いいたします。<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    {app_name} により提供されています
                    </div>

                    </div>
                    </div>',


                    'nl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Nieuwe deal aangemaakt</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Er is succesvol een nieuwe deal aangemaakt.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    We informeren je graag dat er succesvol een nieuwe deal is aangemaakt in <strong>{app_name}</strong>.
                    Hieronder vind je de details van de deal:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Dealnaam:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Fase:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Dealprijs:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Je kunt deze deal op elk moment bekijken en beheren via je dashboard.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Deal bekijken
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Als je vragen hebt of hulp nodig hebt, neem dan gerust contact op met ons supportteam.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Met vriendelijke groet,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Aangedreven door {app_name}
                    </div>

                    </div>
                    </div>',


                    'pl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Utworzono nową transakcję</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Nowa transakcja została pomyślnie utworzona.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Witaj,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Z przyjemnością informujemy, że w <strong>{app_name}</strong> została pomyślnie utworzona nowa transakcja.
                    Poniżej znajdują się szczegóły transakcji:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nazwa transakcji:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Etap:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Cena transakcji:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Możesz wyświetlić i zarządzać tą transakcją w dowolnym momencie z poziomu swojego panelu.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Zobacz transakcję
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Jeśli masz pytania lub potrzebujesz pomocy, skontaktuj się z naszym zespołem wsparcia.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Pozdrawiamy,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Obsługiwane przez {app_name}
                    </div>

                    </div>
                    </div>',


                    'ru' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Создана новая сделка</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Новая сделка была успешно создана.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Здравствуйте,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Мы рады сообщить вам, что новая сделка была успешно создана в <strong>{app_name}</strong>.
                    Ниже приведены детали сделки:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Название сделки:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Воронка:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Этап:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Статус:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Стоимость сделки:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Вы можете просмотреть и управлять этой сделкой в любое время через вашу панель управления.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Посмотреть сделку
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Если у вас есть вопросы или вам нужна помощь, пожалуйста, свяжитесь с нашей службой поддержки.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    С уважением,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Работает на {app_name}
                    </div>

                    </div>
                    </div>',

                    'pt' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Novo negócio criado</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Um novo negócio foi criado com sucesso.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Temos o prazer de informar que um novo negócio foi criado com sucesso em <strong>{app_name}</strong>.
                    Abaixo estão os detalhes do negócio:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nome do negócio:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Etapa:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Preço do negócio:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Você pode visualizar e gerenciar este negócio a qualquer momento em seu painel.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Se tiver alguma dúvida ou precisar de ajuda, entre em contato com nossa equipe de suporte.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Atenciosamente,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Desenvolvido por {app_name}
                    </div>

                    </div>
                    </div>',

                    'pt-BR' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Novo negócio criado</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Um novo negócio foi criado com sucesso.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    Temos o prazer de informar que um novo negócio foi criado com sucesso em <strong>{app_name}</strong>.
                    Abaixo estão os detalhes do negócio:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Nome do negócio:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Etapa:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Status:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Preço do negócio:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Você pode visualizar e gerenciar este negócio a qualquer momento em seu painel.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Se tiver alguma dúvida ou precisar de ajuda, entre em contato com nossa equipe de suporte.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Atenciosamente,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Desenvolvido por {app_name}
                    </div>

                    </div>
                    </div>',

                    'he' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 עסקה חדשה נוצרה</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">עסקה חדשה נוצרה בהצלחה.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    שלום,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    אנו שמחים להודיע כי עסקה חדשה נוצרה בהצלחה ב-<strong>{app_name}</strong>.
                    להלן פרטי העסקה:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>שם העסקה:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>שלב:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>סטטוס:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>מחיר העסקה:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    ניתן לצפות ולנהל עסקה זו בכל עת דרך לוח הבקרה שלך.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    צפה בעסקה
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    אם יש לך שאלות או שאתה זקוק לעזרה, אל תהסס לפנות לצוות התמיכה שלנו.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    בברכה,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    מופעל על ידי {app_name}
                    </div>

                    </div>
                    </div>',

                    'tr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 Yeni anlaşma oluşturuldu</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Yeni bir anlaşma başarıyla oluşturuldu.</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Merhaba,
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    <strong>{app_name}</strong> içinde yeni bir anlaşmanın başarıyla oluşturulduğunu bildirmekten memnuniyet duyuyoruz.
                    Aşağıda anlaşmanın detaylarını bulabilirsiniz:
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>Anlaşma Adı:</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Pipeline:</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Aşama:</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Durum:</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>Anlaşma Fiyatı:</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    Bu anlaşmayı istediğiniz zaman kontrol panelinizden görüntüleyebilir ve yönetebilirsiniz.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    Anlaşmayı Görüntüle
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    Herhangi bir sorunuz varsa veya yardıma ihtiyacınız olursa destek ekibimizle iletişime geçebilirsiniz.
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    Saygılarımızla,<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    {app_name} tarafından desteklenmektedir
                    </div>

                    </div>
                    </div>',

                    'zh' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#4f46e5);color:#ffffff;padding:24px 30px;">
                    <h2 style="margin:0;font-size:22px;">🎉 新交易已创建</h2>
                    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">一个新的交易已成功创建。</p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    您好，
                    </p>

                    <p style="font-size:15px;color:#374151;">
                    我们很高兴地通知您，一个新的交易已在 <strong>{app_name}</strong> 中成功创建。
                    以下是该交易的详细信息：
                    </p>

                    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:25px 0;border:1px solid #e5e7eb;">

                    <p style="margin:8px 0;font-size:14px;"><strong>交易名称：</strong> {deal_name}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>销售管道：</strong> {deal_pipeline}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>阶段：</strong> {deal_stage}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>状态：</strong> {deal_status}</p>
                    <p style="margin:8px 0;font-size:14px;"><strong>交易价格：</strong> {deal_price}</p>

                    </div>

                    <p style="font-size:15px;color:#374151;">
                    您可以随时通过您的仪表板查看和管理此交易。
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">
                    查看交易
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                    如果您有任何问题或需要帮助，请随时联系我们的支持团队。
                    </p>

                    <p style="font-size:15px;color:#374151;margin-bottom:0;">
                    此致敬礼，<br>
                    <strong>{company_name}</strong>
                    </p>

                    </div>

                    <div style="background:#f9fafb;text-align:center;padding:16px;font-size:13px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    由 {app_name} 提供支持
                    </div>

                    </div>
                    </div>',
                ],
            ],

            'Deal Move' => [
                'subject' => 'Deal has been Moved',
                'variables' => '{
                    "App Url": "app_url",
                    "App Name": "app_name",
                    "Company Name ":"company_name",
                    "Deal Name": "deal_name",
                    "Deal Pipeline": "deal_pipeline",
                    "Deal Status": "deal_status",
                    "Deal Price": "deal_price",
                    "Deal Old Stage": "deal_old_stage",
                    "Deal New Stage": "deal_new_stage"
                  }',
                'lang' => [
                    'ar' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">تم تحديث مرحلة الصفقة 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    تم نقل الصفقة بنجاح إلى مرحلة جديدة
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    مرحباً،
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    تم نقل الصفقة <strong>{deal_name}</strong> إلى مرحلة جديدة في خط الأنابيب.
                    يرجى الاطلاع على تفاصيل الصفقة المحدثة أدناه.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>اسم الصفقة:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>خط الأنابيب:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>المرحلة السابقة:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>المرحلة الجديدة:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>الحالة:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>قيمة الصفقة:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    عرض الصفقة
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    إذا كان لديك أي استفسار بخصوص هذا التحديث، فلا تتردد في التواصل معنا.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'da' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Deal fase opdateret 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    En deal er blevet flyttet til en ny fase
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Hej,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    Deal <strong>{deal_name}</strong> er blevet flyttet til en ny fase i pipelinen.
                    Se de opdaterede deal-oplysninger nedenfor.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal navn:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Tidligere fase:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Ny fase:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal pris:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Se deal
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Hvis du har spørgsmål til denne opdatering, er du velkommen til at kontakte os.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'de' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Deal-Phase aktualisiert 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Ein Deal wurde erfolgreich in eine neue Phase verschoben
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    Der Deal <strong>{deal_name}</strong> wurde in eine neue Phase der Pipeline verschoben.
                    Bitte sehen Sie sich die aktualisierten Deal-Informationen unten an.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal-Name:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Vorherige Phase:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Neue Phase:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal Preis:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Deal anzeigen
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Wenn Sie Fragen zu diesem Update haben, können Sie uns gerne kontaktieren.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'en' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                        <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                            <h2 style="margin:0;font-size:22px;">Deal Stage Updated 🚀</h2>
                            <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                                A deal has been successfully moved to a new stage
                            </p>
                        </div>

                        <div style="padding:30px;">

                            <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                                Hello,
                            </p>

                            <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                                The deal <strong>{deal_name}</strong> has been moved to a new stage in the pipeline.
                                Please find the updated deal information below.
                            </p>

                            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>Deal Name:</strong> {deal_name}
                                </p>

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>Pipeline:</strong> {deal_pipeline}
                                </p>

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>Previous Stage:</strong> {deal_old_stage}
                                </p>

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>New Stage:</strong> {deal_new_stage}
                                </p>

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>Status:</strong> {deal_status}
                                </p>

                                <p style="margin:8px 0;font-size:14px;color:#374151;">
                                    <strong>Deal Price:</strong> {deal_price}
                                </p>

                            </div>

                            <div style="text-align:center;margin-top:10px;">
                                <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                                    View Deal
                                </a>
                            </div>

                            <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                                If you have any questions regarding this update, feel free to contact us.
                            </p>

                        </div>
                    </div>
                    </div>',

                    'es' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Etapa del trato actualizada 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Un trato ha sido movido exitosamente a una nueva etapa
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Hola,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    El trato <strong>{deal_name}</strong> ha sido movido a una nueva etapa en el pipeline.
                    Consulta los detalles actualizados del trato a continuación.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nombre del trato:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Etapa anterior:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nueva etapa:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Estado:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Precio del trato:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Ver trato
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Si tienes alguna pregunta sobre esta actualización, no dudes en contactarnos.
                    </p>

                    </div>
                    </div>
                    </div>',

                   'fr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Étape du deal mise à jour 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Un deal a été déplacé avec succès vers une nouvelle étape
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Bonjour,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    Le deal <strong>{deal_name}</strong> a été déplacé vers une nouvelle étape du pipeline.
                    Veuillez consulter les informations mises à jour ci-dessous.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nom du deal :</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline :</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Étape précédente :</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nouvelle étape :</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Statut :</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Prix du deal :</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Voir le deal
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Si vous avez des questions concernant cette mise à jour, n\'hésitez pas à nous contacter.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'it' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Fase della trattativa aggiornata 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Una trattativa è stata spostata con successo in una nuova fase
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Ciao,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    La trattativa <strong>{deal_name}</strong> è stata spostata in una nuova fase della pipeline.
                    Consulta i dettagli aggiornati della trattativa qui sotto.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nome trattativa:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Fase precedente:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nuova fase:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Stato:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Prezzo trattativa:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Visualizza trattativa
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Se hai domande riguardo questo aggiornamento, non esitare a contattarci.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'ja' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">ディールのステージが更新されました 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    ディールが新しいステージへ移動しました
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    こんにちは、
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    ディール <strong>{deal_name}</strong> がパイプライン内の新しいステージに移動しました。
                    以下で更新されたディール情報をご確認ください。
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>ディール名:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>パイプライン:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>以前のステージ:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>新しいステージ:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>ステータス:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>ディール価格:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    ディールを見る
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    この更新についてご質問がある場合は、お気軽にお問い合わせください。
                    </p>

                    </div>
                    </div>
                    </div>',

                    'nl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Deal fase bijgewerkt 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Een deal is succesvol naar een nieuwe fase verplaatst
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    De deal <strong>{deal_name}</strong> is verplaatst naar een nieuwe fase in de pipeline.
                    Bekijk hieronder de bijgewerkte dealinformatie.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal naam:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Vorige fase:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nieuwe fase:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Deal prijs:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Bekijk deal
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Als je vragen hebt over deze update, neem dan gerust contact met ons op.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Etap transakcji zaktualizowany 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Transakcja została pomyślnie przeniesiona do nowego etapu
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Witaj,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    Transakcja <strong>{deal_name}</strong> została przeniesiona do nowego etapu w pipeline.
                    Poniżej znajdziesz zaktualizowane informacje o transakcji.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nazwa transakcji:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Poprzedni etap:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nowy etap:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Cena transakcji:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Zobacz transakcję
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Jeśli masz pytania dotyczące tej aktualizacji, skontaktuj się z nami.
                    </p>

                    </div>
                    </div>
                    </div>',
                    'ru' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Этап сделки обновлен 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Сделка успешно перемещена на новый этап
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Здравствуйте,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    Сделка <strong>{deal_name}</strong> была перемещена на новый этап в воронке продаж.
                    Ниже приведена обновленная информация о сделке.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Название сделки:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Воронка:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Предыдущий этап:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Новый этап:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Статус:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Цена сделки:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Посмотреть сделку
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Если у вас есть вопросы по этому обновлению, пожалуйста, свяжитесь с нами.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pt' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Etapa do negócio atualizada 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Um negócio foi movido com sucesso para uma nova etapa
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    O negócio <strong>{deal_name}</strong> foi movido para uma nova etapa no pipeline.
                    Veja abaixo os detalhes atualizados do negócio.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nome do negócio:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Etapa anterior:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nova etapa:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Preço do negócio:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Se tiver alguma dúvida sobre esta atualização, entre em contato conosco.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pt-BR' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Etapa do negócio atualizada 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Um negócio foi movido com sucesso para uma nova etapa
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    O negócio <strong>{deal_name}</strong> foi movido para uma nova etapa no pipeline.
                    Veja abaixo os detalhes atualizados do negócio.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nome do negócio:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Etapa anterior:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Nova etapa:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Status:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Preço do negócio:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Se tiver alguma dúvida sobre esta atualização, entre em contato conosco.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'he' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">שלב העסקה עודכן 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    עסקה הועברה בהצלחה לשלב חדש
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    שלום,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    העסקה <strong>{deal_name}</strong> הועברה לשלב חדש בפייפליין.
                    להלן פרטי העסקה המעודכנים.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>שם העסקה:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>שלב קודם:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>שלב חדש:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>סטטוס:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>מחיר העסקה:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    צפה בעסקה
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    אם יש לך שאלות לגבי עדכון זה, אל תהסס לפנות אלינו.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'tr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">Anlaşma Aşaması Güncellendi 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    Bir anlaşma başarıyla yeni bir aşamaya taşındı
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    Merhaba,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    <strong>{deal_name}</strong> anlaşması pipeline içinde yeni bir aşamaya taşındı.
                    Aşağıda güncellenmiş anlaşma detaylarını görebilirsiniz.
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Anlaşma Adı:</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Pipeline:</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Önceki Aşama:</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Yeni Aşama:</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Durum:</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>Anlaşma Fiyatı:</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    Anlaşmayı Görüntüle
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    Bu güncelleme hakkında herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'zh' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                    <div style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:28px 30px;color:#ffffff;">
                    <h2 style="margin:0;font-size:22px;">交易阶段已更新 🚀</h2>
                    <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">
                    交易已成功移动到新的阶段
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin:0 0 18px 0;">
                    您好，
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 22px 0;">
                    交易 <strong>{deal_name}</strong> 已被移动到销售管道中的新阶段。
                    请查看下面更新后的交易详情。
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:22px;">

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>交易名称：</strong> {deal_name}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>销售管道：</strong> {deal_pipeline}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>之前阶段：</strong> {deal_old_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>新阶段：</strong> {deal_new_stage}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>状态：</strong> {deal_status}
                    </p>

                    <p style="margin:8px 0;font-size:14px;color:#374151;">
                    <strong>交易价格：</strong> {deal_price}
                    </p>

                    </div>

                    <div style="text-align:center;margin-top:10px;">
                    <a href="{app_url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;">
                    查看交易
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;margin-top:28px;line-height:1.6;">
                    如果您对此更新有任何疑问，请随时与我们联系。
                    </p>

                    </div>
                    </div>
                    </div>',
                ],
            ],

            'Lead Emails' => [
                'subject' => 'Lead Email Create',
                'variables' => '{
                    "Lead Name": "lead_name",
                    "Lead Subject": "lead_email_subject",
                    "Lead Description": "lead_email_description",
                    "App Url": "app_url",
                    "App Name": "app_name",
                    "Company Name": "company_name"
                }',
                'lang' => [
                    'ar' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 تم استلام بريد إلكتروني جديد من عميل محتمل</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">لقد استلمت رسالة جديدة من عميل محتمل</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> مرحبًا 👋، </p> <p> تم إنشاء بريد إلكتروني جديد لعميل محتمل في <strong>{app_name}</strong>. يرجى مراجعة تفاصيل الرسالة أدناه. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>اسم العميل المحتمل:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>الموضوع:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>الرسالة:</strong><br> {lead_email_description} </p> </div> <p> يمكنك عرض أو إدارة هذا العميل المحتمل مباشرة من لوحة التحكم الخاصة بك. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> عرض في {app_name} </a> </div> <p style="margin-bottom:0;"> شكرًا،<br> <strong>{company_name}</strong> </p>',
                    'da' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Ny lead-email modtaget</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Du har modtaget en ny besked fra en lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Hej 👋, </p> <p> En ny email er blevet oprettet for en lead i <strong>{app_name}</strong>. Se venligst beskeddetaljerne nedenfor. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Lead navn:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Emne:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Besked:</strong><br> {lead_email_description} </p> </div> <p> Du kan se eller administrere denne lead direkte fra dit dashboard. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Se i {app_name} </a> </div> <p style="margin-bottom:0;"> Tak,<br> <strong>{company_name}</strong> </p>',
                    'de' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Neue Lead-E-Mail erhalten</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Sie haben eine neue Nachricht von einem Lead erhalten</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Hallo 👋, </p> <p> Eine neue E-Mail wurde für einen Lead in <strong>{app_name}</strong> erstellt. Bitte überprüfen Sie die Nachrichtendetails unten. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Lead Name:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Betreff:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Nachricht:</strong><br> {lead_email_description} </p> </div> <p> Sie können diesen Lead direkt über Ihr Dashboard anzeigen oder verwalten. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> In {app_name} ansehen </a> </div> <p style="margin-bottom:0;"> Danke,<br> <strong>{company_name}</strong> </p>',
                    'en' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 New Lead Email Received</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">You have received a new message from a lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Hello 👋, </p> <p> A new email has been created for a lead in <strong>{app_name}</strong>. Please review the message details below. </p> <!-- Lead Info Box --> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Lead Name:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Subject:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Message:</strong><br> {lead_email_description} </p> </div> <p> You can view or manage this lead directly from your dashboard. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> View in {app_name} </a> </div> <p style="margin-bottom:0;"> Thanks,<br> <strong>{company_name}</strong> </p>',
                    'es' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Nuevo correo de lead recibido</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Has recibido un nuevo mensaje de un lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Hola 👋, </p> <p> Se ha creado un nuevo correo para un lead en <strong>{app_name}</strong>. Por favor revisa los detalles del mensaje a continuación. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nombre del lead:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Asunto:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Mensaje:</strong><br> {lead_email_description} </p> </div> <p> Puedes ver o gestionar este lead directamente desde tu panel. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Ver en {app_name} </a> </div> <p style="margin-bottom:0;"> Gracias,<br> <strong>{company_name}</strong> </p>',
                    'fr' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Nouvel e-mail de prospect reçu</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Vous avez reçu un nouveau message d’un prospect</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Bonjour 👋, </p> <p> Un nouvel e-mail a été créé pour un prospect dans <strong>{app_name}</strong>. Veuillez consulter les détails du message ci-dessous. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nom du prospect :</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Sujet :</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Message :</strong><br> {lead_email_description} </p> </div> <p> Vous pouvez voir ou gérer ce prospect directement depuis votre tableau de bord. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Voir dans {app_name} </a> </div> <p style="margin-bottom:0;"> Merci,<br> <strong>{company_name}</strong> </p>',
                   'it' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Nuova email di lead ricevuta</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Hai ricevuto un nuovo messaggio da un lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Ciao 👋, </p> <p> È stata creata una nuova email per un lead in <strong>{app_name}</strong>. Si prega di controllare i dettagli del messaggio qui sotto. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nome Lead:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Oggetto:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Messaggio:</strong><br> {lead_email_description} </p> </div> <p> Puoi visualizzare o gestire questo lead direttamente dalla tua dashboard. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Visualizza in {app_name} </a> </div> <p style="margin-bottom:0;"> Grazie,<br> <strong>{company_name}</strong> </p>',
                    'ja' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 新しいリードメールを受信しました</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">リードから新しいメッセージを受信しました</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> こんにちは 👋、 </p> <p> <strong>{app_name}</strong> に新しいリードメールが作成されました。以下のメッセージ内容をご確認ください。 </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>リード名:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>件名:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>メッセージ:</strong><br> {lead_email_description} </p> </div> <p> ダッシュボードからこのリードを直接確認または管理できます。 </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> {app_name} で表示 </a> </div> <p style="margin-bottom:0;"> ありがとうございます。<br> <strong>{company_name}</strong> </p>',
                    'nl' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Nieuwe lead-e-mail ontvangen</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Je hebt een nieuw bericht van een lead ontvangen</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Hallo 👋, </p> <p> Er is een nieuwe e-mail aangemaakt voor een lead in <strong>{app_name}</strong>. Bekijk hieronder de details van het bericht. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Leadnaam:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Onderwerp:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Bericht:</strong><br> {lead_email_description} </p> </div> <p> Je kunt deze lead direct bekijken of beheren vanuit je dashboard. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Bekijken in {app_name} </a> </div> <p style="margin-bottom:0;"> Bedankt,<br> <strong>{company_name}</strong> </p>',
                    'pl' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Otrzymano nowy e-mail od leada</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Otrzymałeś nową wiadomość od leada</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Cześć 👋, </p> <p> Nowy e-mail został utworzony dla leada w <strong>{app_name}</strong>. Sprawdź szczegóły wiadomości poniżej. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nazwa leada:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Temat:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Wiadomość:</strong><br> {lead_email_description} </p> </div> <p> Możesz wyświetlić lub zarządzać tym leadem bezpośrednio z panelu. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Zobacz w {app_name} </a> </div> <p style="margin-bottom:0;"> Dziękujemy,<br> <strong>{company_name}</strong> </p>',
                    'ru' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Получено новое письмо от лида</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Вы получили новое сообщение от лида</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Здравствуйте 👋, </p> <p> Для лида в <strong>{app_name}</strong> было создано новое письмо. Пожалуйста, ознакомьтесь с деталями сообщения ниже. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Имя лида:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Тема:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Сообщение:</strong><br> {lead_email_description} </p> </div> <p> Вы можете просмотреть или управлять этим лидом прямо из панели управления. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Открыть в {app_name} </a> </div> <p style="margin-bottom:0;"> Спасибо,<br> <strong>{company_name}</strong> </p>',
                    'pt' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Novo e-mail de lead recebido</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Você recebeu uma nova mensagem de um lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Olá 👋, </p> <p> Um novo e-mail foi criado para um lead em <strong>{app_name}</strong>. Por favor, veja os detalhes da mensagem abaixo. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nome do lead:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Assunto:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Mensagem:</strong><br> {lead_email_description} </p> </div> <p> Você pode visualizar ou gerenciar este lead diretamente do seu painel. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Ver em {app_name} </a> </div> <p style="margin-bottom:0;"> Obrigado,<br> <strong>{company_name}</strong> </p>',
                    'pt-BR' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Novo e-mail de lead recebido</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Você recebeu uma nova mensagem de um lead</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Olá 👋, </p> <p> Um novo e-mail foi criado para um lead em <strong>{app_name}</strong>. Por favor, veja os detalhes da mensagem abaixo. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Nome do lead:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Assunto:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Mensagem:</strong><br> {lead_email_description} </p> </div> <p> Você pode visualizar ou gerenciar este lead diretamente do seu painel. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> Ver em {app_name} </a> </div> <p style="margin-bottom:0;"> Obrigado,<br> <strong>{company_name}</strong> </p>',
                    'he' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 התקבל אימייל חדש מליד</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">קיבלת הודעה חדשה מליד</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> שלום 👋, </p> <p> נוצר אימייל חדש עבור ליד ב-<strong>{app_name}</strong>. אנא בדוק את פרטי ההודעה למטה. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>שם הליד:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>נושא:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>הודעה:</strong><br> {lead_email_description} </p> </div> <p> ניתן לצפות או לנהל את הליד הזה ישירות מלוח הבקרה שלך. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> הצג ב-{app_name} </a> </div> <p style="margin-bottom:0;"> תודה,<br> <strong>{company_name}</strong> </p>',
                    'tr' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 Yeni lead e-postası alındı</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Bir lead’den yeni bir mesaj aldınız</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> Merhaba 👋, </p> <p> <strong>{app_name}</strong> içinde bir lead için yeni bir e-posta oluşturuldu. Lütfen aşağıdaki mesaj detaylarını inceleyin. </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>Lead Adı:</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>Konu:</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>Mesaj:</strong><br> {lead_email_description} </p> </div> <p> Bu lead’i doğrudan kontrol panelinizden görüntüleyebilir veya yönetebilirsiniz. </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> {app_name} içinde görüntüle </a> </div> <p style="margin-bottom:0;"> Teşekkürler,<br> <strong>{company_name}</strong> </p>',
                    'zh' => '<div style="background:#4f46e5;padding:28px 20px;text-align:center;color:#ffffff;"> <h1 style="margin:0;font-size:22px;font-weight:600;">📩 收到新的潜在客户邮件</h1> <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">您收到了一条来自潜在客户的新消息</p> </div> <div style="padding:30px 28px;color:#374151;font-size:15px;line-height:1.6;"> <p style="margin-top:0;"> 您好 👋， </p> <p> 在 <strong>{app_name}</strong> 中已为潜在客户创建了一封新的邮件。请查看以下消息详情。 </p> <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;"> <p style="margin:0 0 10px 0;"> <strong>潜在客户名称：</strong> {lead_name} </p> <p style="margin:0 0 10px 0;"> <strong>主题：</strong> {lead_email_subject} </p> <p style="margin:0;"> <strong>消息：</strong><br> {lead_email_description} </p> </div> <p> 您可以直接从仪表板查看或管理该潜在客户。 </p> <div style="text-align:center;margin:30px 0;"> <a href="{app_url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;"> 在 {app_name} 中查看 </a> </div> <p style="margin-bottom:0;"> 谢谢，<br> <strong>{company_name}</strong> </p>',
                ],
            ],

            'Deal Emails' => [
                'subject' => 'Deal Email Create',
                'variables' => '{
                    "Deal Name": "deal_name",
                    "Deal Subject": "deal_email_subject",
                    "Deal Description": "deal_email_description",
                    "App Url": "app_url",
                    "App Name": "app_name",
                    "Company Name": "company_name"
                }',
                'lang' => [
                    'ar' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 تم إنشاء صفقة جديدة
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    تم إنشاء فرصة جديدة في {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    مرحبًا،
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    أخبار رائعة! تم إنشاء صفقة جديدة ومشاركتها معك. فيما يلي تفاصيل الصفقة:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>اسم الصفقة:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>الموضوع:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>الوصف:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    يمكنك عرض هذه الصفقة وإدارتها مباشرة من التطبيق بالنقر على الزر أدناه.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    عرض الصفقة
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    إذا كان لديك أي أسئلة أو تحتاج إلى مزيد من التفاصيل، يمكنك التحقق من الصفقة داخل التطبيق.
                    </p>

                    </div>
                    </div>
                    </div>',

                   'da' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Ny aftale oprettet
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    En ny mulighed er blevet oprettet i {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hej,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Gode nyheder! En ny aftale er blevet oprettet og delt med dig. Her er detaljerne:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Aftale navn:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Emne:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Beskrivelse:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Du kan se og administrere denne aftale direkte fra applikationen ved at klikke på knappen nedenfor.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Se aftale
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Hvis du har spørgsmål eller har brug for flere detaljer, kan du tjekke aftalen i applikationen.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'de' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Neuer Deal erstellt
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Eine neue Verkaufschance wurde in {app_name} erstellt
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Gute Nachrichten! Ein neuer Deal wurde erstellt und mit Ihnen geteilt. Hier sind die Details des Deals:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Deal Name:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Betreff:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Beschreibung:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Sie können diesen Deal direkt in der Anwendung ansehen und verwalten, indem Sie auf die Schaltfläche unten klicken.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Deal ansehen
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Wenn Sie Fragen haben oder weitere Details benötigen, können Sie den Deal in der Anwendung überprüfen.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'en' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                        <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                            <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                                <h1 style="margin:0;font-size:26px;font-weight:600;">
                                    🎉 New Deal Created
                                </h1>
                                <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                                    A new opportunity has been created in {app_name}
                                </p>
                            </div>

                            <div style="padding:30px;">

                                <p style="font-size:15px;color:#374151;margin-top:0;">
                                    Hello,
                                </p>

                                <p style="font-size:15px;color:#374151;line-height:1.6;">
                                    Great news! A new deal has been created and shared with you.  
                                    Here are the details of the deal:
                                </p>

                                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                                        <strong>Deal Name:</strong> {deal_name}
                                    </p>

                                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                                        <strong>Subject:</strong> {deal_email_subject}
                                    </p>

                                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                                        <strong>Description:</strong> {deal_email_description}
                                    </p>

                                </div>

                                <p style="font-size:15px;color:#374151;line-height:1.6;">
                                    You can view and manage this deal directly from the application by clicking the button below.
                                </p>

                                <div style="text-align:center;margin:30px 0;">
                                    <a href="{app_url}" 
                                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                                    View Deal
                                    </a>
                                </div>

                                <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                                    If you have any questions or need more details, feel free to check the deal inside the application.
                                </p>
                            </div>
                        </div>
                    </div>',
                    'es' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Nuevo trato creado
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Se ha creado una nueva oportunidad en {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hola,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    ¡Buenas noticias! Se ha creado un nuevo trato y se ha compartido contigo. Aquí están los detalles:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nombre del trato:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Asunto:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Descripción:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Puedes ver y administrar este trato directamente desde la aplicación haciendo clic en el botón de abajo.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Ver trato
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Si tienes alguna pregunta o necesitas más detalles, puedes revisar el trato dentro de la aplicación.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'fr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Nouvelle opportunité créée
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Une nouvelle opportunité a été créée dans {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Bonjour,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Bonne nouvelle ! Une nouvelle opportunité a été créée et partagée avec vous. Voici les détails :
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nom de l’opportunité :</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Sujet :</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Description :</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Vous pouvez consulter et gérer cette opportunité directement depuis l\application en cliquant sur le bouton ci-dessous.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Voir l’opportunité
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Si vous avez des questions ou besoin de plus de détails, vous pouvez consulter l’opportunité dans l’application.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'it' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Nuova trattativa creata
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Una nuova opportunità è stata creata in {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Ciao,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Ottime notizie! Una nuova trattativa è stata creata e condivisa con te. Ecco i dettagli:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nome trattativa:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Oggetto:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Descrizione:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Puoi visualizzare e gestire questa trattativa direttamente dall\applicazione cliccando sul pulsante qui sotto.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Visualizza trattativa
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Se hai domande o hai bisogno di maggiori dettagli, puoi controllare la trattativa nell\applicazione.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'ja' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 新しい案件が作成されました
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    {app_name} に新しい機会が作成されました
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    こんにちは、
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    良いお知らせです！新しい案件が作成され、あなたと共有されました。詳細は以下の通りです。
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>案件名:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>件名:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>説明:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    下のボタンをクリックして、アプリケーションからこの案件を確認・管理できます。
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    案件を見る
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    ご不明な点がある場合は、アプリケーション内で案件の詳細をご確認ください。
                    </p>

                    </div>
                    </div>
                    </div>',   

                    'nl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Nieuwe deal aangemaakt
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Er is een nieuwe kans aangemaakt in {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Hallo,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Goed nieuws! Er is een nieuwe deal aangemaakt en met u gedeeld. Hieronder vindt u de details:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Deal naam:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Onderwerp:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Beschrijving:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    U kunt deze deal direct vanuit de applicatie bekijken en beheren door op de onderstaande knop te klikken.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Bekijk deal
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Als u vragen heeft of meer details nodig heeft, kunt u de deal in de applicatie bekijken.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pl' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Utworzono nową transakcję
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Nowa szansa została utworzona w {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Witaj,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Dobra wiadomość! Nowa transakcja została utworzona i udostępniona Tobie. Oto szczegóły:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nazwa transakcji:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Temat:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Opis:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Możesz zobaczyć i zarządzać tą transakcją bezpośrednio w aplikacji, klikając przycisk poniżej.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Zobacz transakcję
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Jeśli masz pytania lub potrzebujesz więcej szczegółów, możesz sprawdzić transakcję w aplikacji.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'ru' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Создана новая сделка
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Новая возможность была создана в {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Здравствуйте,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Хорошие новости! Новая сделка была создана и поделена с вами. Вот подробности:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Название сделки:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Тема:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Описание:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Вы можете просмотреть и управлять этой сделкой прямо из приложения, нажав кнопку ниже.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Посмотреть сделку
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Если у вас есть вопросы или вам нужны дополнительные детали, вы можете проверить сделку в приложении.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pt' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Novo negócio criado
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Uma nova oportunidade foi criada em {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Boas notícias! Um novo negócio foi criado e compartilhado com você. Aqui estão os detalhes:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nome do negócio:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Assunto:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Descrição:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Você pode visualizar e gerenciar este negócio diretamente no aplicativo clicando no botão abaixo.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Se você tiver alguma dúvida ou precisar de mais detalhes, pode verificar o negócio dentro do aplicativo.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'pt-BR' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Novo negócio criado
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    Uma nova oportunidade foi criada em {app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Olá,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Boas notícias! Um novo negócio foi criado e compartilhado com você. Aqui estão os detalhes:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Nome do negócio:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Assunto:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Descrição:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Você pode visualizar e gerenciar este negócio diretamente no aplicativo clicando no botão abaixo.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Ver negócio
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Se você tiver alguma dúvida ou precisar de mais detalhes, pode verificar o negócio dentro do aplicativo.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'he' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 עסקה חדשה נוצרה
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    נוצרה הזדמנות חדשה ב־{app_name}
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    שלום,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    חדשות טובות! עסקה חדשה נוצרה ושותפה איתך. הנה הפרטים:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>שם העסקה:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>נושא:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>תיאור:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    ניתן לצפות ולנהל את העסקה ישירות מהמערכת על ידי לחיצה על הכפתור למטה.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    צפה בעסקה
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    אם יש לך שאלות או צורך בפרטים נוספים, ניתן לבדוק את העסקה בתוך המערכת.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'tr' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 Yeni anlaşma oluşturuldu
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    {app_name} içinde yeni bir fırsat oluşturuldu
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    Merhaba,
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Harika haber! Yeni bir anlaşma oluşturuldu ve sizinle paylaşıldı. İşte detaylar:
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Anlaşma Adı:</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Konu:</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>Açıklama:</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    Aşağıdaki düğmeye tıklayarak bu anlaşmayı doğrudan uygulama üzerinden görüntüleyebilir ve yönetebilirsiniz.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    Anlaşmayı Görüntüle
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    Herhangi bir sorunuz varsa veya daha fazla ayrıntıya ihtiyacınız varsa, anlaşmayı uygulama içinde kontrol edebilirsiniz.
                    </p>

                    </div>
                    </div>
                    </div>',

                    'zh' => '<div style="font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#f3f5fb;padding:40px 20px;">

                    <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.05);">

                    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:30px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:600;">
                    🎉 已创建新的交易
                    </h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
                    在 {app_name} 中已创建新的机会
                    </p>
                    </div>

                    <div style="padding:30px;">

                    <p style="font-size:15px;color:#374151;margin-top:0;">
                    您好，
                    </p>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    好消息！一个新的交易已经创建并与您共享。以下是交易详情：
                    </p>

                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:25px 0;">

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>交易名称：</strong> {deal_name}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>主题：</strong> {deal_email_subject}
                    </p>

                    <p style="margin:6px 0;font-size:14px;color:#111827;">
                    <strong>描述：</strong> {deal_email_description}
                    </p>

                    </div>

                    <p style="font-size:15px;color:#374151;line-height:1.6;">
                    您可以点击下面的按钮，直接在应用程序中查看和管理此交易。
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                    <a href="{app_url}" 
                    style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
                    查看交易
                    </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;line-height:1.6;">
                    如果您有任何问题或需要更多详细信息，可以在应用程序中查看该交易。
                    </p>

                    </div>
                    </div>
                    </div>',
                ],
            ],


        ];
        foreach($emailTemplate as $eTemp)
        {
            $table = EmailTemplate::where('name',$eTemp)->where('module_name','Lead')->exists();
            if(!$table)
            {
                $emailtemplate=  EmailTemplate::create(
                    [
                    'name' => $eTemp,
                    'from' => !empty(env('APP_NAME')) ? env('APP_NAME') : 'WorkDo Dash',
                    'module_name' => 'Lead',
                    'created_by' => $admin->id,
                    'creator_id' => $admin->id,
                    ]
                );
                foreach($defaultTemplate[$eTemp]['lang'] as $lang => $content)
                {
                    EmailTemplateLang::create(
                        [
                            'parent_id' => $emailtemplate->id,
                            'lang' => $lang,
                            'subject' => $defaultTemplate[$eTemp]['subject'],
                            'variables' => $defaultTemplate[$eTemp]['variables'],
                            'content' => $content,
                        ]
                    );
                }
            }
        }
    }
}
