# AWS SES Production Access — Rejection and Resolution

## Context

Email sending (verification on register, password reset) requires AWS SES production access. The app was built with SES as the email provider. Production access was requested and rejected.

## Timeline

### 1. Initial Request

Submitted a request to move SES out of sandbox. Described the use case: transactional emails only (email verification, password reset), expected volume 5–20 emails per month, domain verified with DKIM and custom MAIL FROM.

### 2. AWS Response — Information Request

AWS asked for more detail about the use case, how recipient lists are maintained, how bounces and complaints are handled, and examples of email content.

### 3. Follow-Up Submitted

Provided full detail: personal job application tracking app at nagarenegishi.com, transactional only, no marketing, no bulk, no mailing lists. Users provide their own email at registration. Domain verified with DKIM and custom MAIL FROM. SES dashboard monitored for bounces and complaints.

### 4. AWS Response — Rejection (Final)

> Hello,
>
> Thank you for your patience. We've carefully reviewed your request for increased sending limits on Amazon SES. While we appreciate your interest in expanding your email capabilities, we are unable to approve an increase at this time.
>
> As part of our commitment to maintaining high service quality for all customers, we conduct thorough reviews of each limit increase request. During our evaluation, we identified some concerns that prevent us from approving your request.
>
> Due to security reasons, we are unable to provide specific details about our assessment criteria.
>
> For additional guidance, please review our AWS Acceptable Use Policy (http://aws.amazon.com/aup/) and AWS Service Terms (http://aws.amazon.com/serviceterms/). We appreciate your understanding in this matter.
>
> Thank you for contacting Amazon Web Services.
>
> Best regards,
> Trust and Safety

No actionable information was provided. No specific reason for rejection. No guidance on what to change.

## Research

Reviewed the AWS Acceptable Use Policy and Service Terms (Section 15, SES). The application does not violate any listed policy.

Community research (AWS re:Post, dev.to, Hacker News) shows this is a widely reported problem. Common findings:

- AWS SES production access rejections frequently provide no specific reason
- AWS Support cannot share rejection criteria and cannot override Trust and Safety decisions
- Reported contributing factors include: new or low-spend AWS accounts, Gmail as the account email, missing DMARC records, no sandbox sending history, generic or missing website on the domain
- Multiple developers with identical use cases (transactional auth emails, low volume) report the same rejection

## Actions Taken After Rejection

Addressed every factor identified in community research:

- **DMARC:** Added TXT record at `_dmarc.nagarenegishi.com` with `v=DMARC1; p=none;` — verified via mxtoolbox
- **Sandbox test email:** Sent a test email from `noreply@nagarenegishi.com` through SES sandbox — SPF PASS, DKIM PASS, DMARC PASS confirmed in Gmail headers
- **Bounce monitoring:** Email feedback forwarding enabled on the sending identity
- **Website:** Portfolio site live at the root domain `nagarenegishi.com`
- **Existing setup (from Step 4 of the plan):** Domain verified with Easy DKIM (RSA_2048_BIT), custom MAIL FROM with SPF and MX, IAM policy scoped to `ses:SendEmail` and `ses:SendRawEmail`

## Response Sent to AWS

Requested specific answers on what caused the rejection, what changes would lead to approval, whether undocumented requirements exist, whether personal accounts are ineligible, and whether the denial is based on automated scoring that cannot be overridden. Full text:

> Thank you for your response. I would like to request clarification on several points, as the rejection provided no actionable information.
>
> My use case is a personal job application tracking web app deployed at nagarenegishi.com. The app sends only transactional emails, specifically email verification on registration and password reset links. Expected volume is 5 to 20 emails per month. There are no marketing emails, no mailing lists, and no unsolicited communication.
>
> I have completed the following technical setup:
>
> - Domain identity verified in SES with Easy DKIM (RSA_2048_BIT signing key), showing "Verified" in the SES console
> - Custom MAIL FROM domain configured with MX record and SPF (TXT record), showing "Verified" in the SES console
> - DMARC record published at _dmarc.nagarenegishi.com with policy p=none
> - IAM policy scoped to ses:SendEmail and ses:SendRawEmail, attached to the EC2 instance role
> - Bounce and complaint email feedback forwarding enabled on the sending identity
> - Sandbox test email sent successfully with SPF, DKIM, and DMARC all passing authentication
> - Planned sending address: noreply@nagarenegishi.com
>
> I am requesting specific answers to the following:
>
> 1. What specific aspect of my use case or account caused this denial? The response states "we believe that your use case would impact the deliverability of our service" but does not explain how transactional verification emails at 5 to 20 per month would do so.
>
> 2. What concrete changes would I need to make for the request to be approved? I am willing to implement any reasonable requirement.
>
> 3. Is there documentation I have missed that lists requirements beyond what is stated at https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html?
>
> 4. Is SES production access unavailable to personal or individual AWS accounts? If this is the case, please state so clearly so I can explore alternative email providers.
>
> 5. If this denial is the result of automated risk scoring that cannot be overridden regardless of the legitimacy of my use case, please confirm that so I do not continue investing time in reapplication.
>
> This feature is blocking a core part of my project (email verification and password reset). If the denial is based on factors I cannot realistically address, I would prefer a clear statement to that effect so I can move to an alternative provider.


## Second Resubmission — Rejection (Account Maturity)

AWS responded with a more specific reason:

> Due to some limiting factors on your account currently, you are not eligible to send SES messages in Asia Pacific (Sydney) region. You will need to show a pattern of use of other AWS services and a consistent paid billing history to gain access to this function.

This confirms the rejection is not related to the technical setup or use case. The issue is account maturity — new account with insufficient billing history and usage of other AWS services. No specific threshold was provided for what constitutes "sufficient" billing history or usage.

## Current Status

- All technical requirements are met (DKIM, DMARC, SPF, custom MAIL FROM, scoped IAM, bounce monitoring, sandbox test passing)
- SES production access is blocked by account-level criteria that cannot be addressed without waiting an undefined period
- Asking AWS for the exact threshold is unlikely to produce a concrete answer based on prior interactions
- The `IEmailService` abstraction is in place, allowing migration to an alternative provider without changes to controllers or frontend code
- SES-SendEmail inline policy removed from EC2 instance role (no cost impact — app now sends via Resend). Policy JSON preserved in the Demo and Auth Features Plan (Step 7) for future reference.