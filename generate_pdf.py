import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

pdf_path = "Mamo_Technical_Support_Part_1_Replies.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=44,
    rightMargin=44,
    topMargin=40,
    bottomMargin=40
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=17,
    leading=21,
    textColor=colors.HexColor('#0F172A'),
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'DocSub',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=colors.HexColor('#64748B'),
    spaceAfter=14
)

h2_style = ParagraphStyle(
    'H2',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=16,
    textColor=colors.HexColor('#1E40AF'),
    spaceBefore=10,
    spaceAfter=6
)

meta_style = ParagraphStyle(
    'Meta',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor('#475569'),
    spaceAfter=4
)

quote_style = ParagraphStyle(
    'Quote',
    parent=styles['Italic'],
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor('#334155'),
    leftIndent=12,
    spaceAfter=8
)

reply_box = ParagraphStyle(
    'Reply',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9.5,
    leading=14,
    textColor=colors.HexColor('#0F172A'),
    leftIndent=12,
    spaceAfter=8
)

story = []

# Title Header
story.append(Paragraph("Mamo: Technical Support Specialist Take-Home", title_style))
story.append(Paragraph("Part 1: Customer Communication Responses | Candidate Submission", subtitle_style))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

# Ticket A
story.append(Paragraph("Ticket A: Email from Merchant (Payout Delay)", h2_style))
story.append(Paragraph('<b>Customer Message:</b> <i>"I was supposed to receive my payout yesterday and it\'s not in my account. I\'m very bothered by this. How can I trust you with my money if it doesn\'t arrive when you say it will? Can you tell me what the delay is? &ndash; Sami"</i>', quote_style))
story.append(Paragraph("<b>Internal Reality:</b> Something is wrong on Mamo's side. Team is investigating; cause and exact resolution ETA are not yet confirmed.", meta_style))
story.append(Paragraph("<b>Response to Sami:</b>", meta_style))

ticket_a_text = """<b>Subject:</b> Re: Missing Payout: Update on your transfer<br/><br/>
Hi Sami,<br/><br/>
I completely understand your concern. When it comes to business cash flow, payouts need to arrive on time, period.<br/><br/>
I checked your account and payout history. The delay is on our end. There was an issue with our payout processing queue yesterday that our engineering team is actively investigating right now. Your funds and banking details are completely secure, but because the team is still diagnosing the issue, I do not have an exact time for when the transfer will land yet.<br/><br/>
I am personally keeping this ticket open and will follow up with an update within the next 2 hours (by 2:30 PM GST), or as soon as I see the transfer dispatch.<br/><br/>
Really sorry for the stress this has caused.<br/><br/>
Best,<br/>
<b>Sanket</b><br/>
Mamo Support"""
story.append(Paragraph(ticket_a_text, reply_box))
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

# Ticket B
story.append(Paragraph("Ticket B: Live Chat Escalated from AI (Purchase Dispute and Refund Demand)", h2_style))
story.append(Paragraph('<b>Customer Message:</b> <i>"hi i want my money back. i ordered a phone case from glowtechstore.com 12 days ago, it never arrived, and when i emailed them twice they didn\'t respond. i saw \'MAMOPAY\' on my card statement so i\'m messaging you instead. please refund me AED 89 today, this is ridiculous"</i>', quote_style))
story.append(Paragraph("<b>Internal Reality:</b> GlowTechStore is a real merchant on Mamo. Payment went through 12 days ago. Mamo only processes payments (no access to merchant stock or authority to unilaterally pull merchant funds for refunds).", meta_style))
story.append(Paragraph("<b>Response to Customer (Live Chat):</b>", meta_style))

ticket_b_text = """Hi there, I completely understand why you're upset. Waiting 12 days with no order and no reply from the store is really frustrating.<br/><br/>
To explain what happened: Mamo is the payment gateway GlowTechStore uses on their website (like the card machine). We can see your AED 89 payment went through to them 12 days ago, but because we only process the transaction, we do not hold their inventory or have access to their order system. By law, we also cannot pull funds from a merchant's account to issue a refund directly; only the store can initiate that.<br/><br/>
Here is what I can do right now to help:<br/>
<b>1.</b> I am flagging this with our Merchant team today so we can contact GlowTechStore's owner directly and push them to respond to you about your order or refund.<br/>
<b>2.</b> Could you share the email address you used for the order and the last 4 digits of your card? I will link those to the escalation.<br/><br/>
If they still do not respond in the next day or two, you can also contact your card issuer to request a chargeback for "goods not received", and your bank can reverse the payment on your behalf.<br/><br/>
Best,<br/>
<b>Sanket</b><br/>
Mamo Support"""
story.append(Paragraph(ticket_b_text, reply_box))
story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

# Ticket C
story.append(Paragraph("Ticket C: Email from Merchant (Repeated Invoices Request Before Deadline)", h2_style))
story.append(Paragraph('<b>Customer Message:</b> <i>"Hi, I\'ve asked three times now for a copy of my invoices for last quarter and nobody has sent them. I\'m submitting my accounts on Sunday. This is the fourth email. Please just send them."</i>', quote_style))
story.append(Paragraph("<b>Internal Reality:</b> Merchant is right. He asked 3 times; 2 prior tickets were closed by mistake on our end. Invoices are ready to attach right now.", meta_style))
story.append(Paragraph("<b>Response to Merchant:</b>", meta_style))

ticket_c_text = """<b>Subject:</b> Re: Invoices: Last Quarter Invoices Attached<br/><br/>
Hi there,<br/><br/>
I have attached all your invoices for last quarter directly to this email so you have them for Sunday.<br/><br/>
You are completely right to be annoyed. Looking through our system, your previous requests were closed by mistake on our side without anyone getting back to you. That is entirely our fault, and I am really sorry for the hassle and having to chase us four times.<br/><br/>
Please check the attached PDFs to make sure you have everything your accountant needs. If anything is missing, just reply directly to this email and I will jump on it right away.<br/><br/>
Best,<br/>
<b>Sanket</b><br/>
Mamo Support<br/>
<i>(Attached: Invoices_Last_Quarter.pdf)</i>"""
story.append(Paragraph(ticket_c_text, reply_box))

doc.build(story)
print(f"Generated: {os.path.abspath(pdf_path)}")
