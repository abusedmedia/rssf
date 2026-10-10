import { Link } from "react-router-dom";
import { ExternalLink } from "../ExternalLink";
import { LegalDocument } from "../legal";

export function PrivacyPage() {
  return (
    <LegalDocument title="Privacy policy">
      <p>
        This policy explains how the hosted RSSF service (“RSSF”, “we”) handles
        personal data. RSSF is operated by Fabio Franchino (
        <ExternalLink href="https://fabiofranchino.com">
          fabiofranchino.com
        </ExternalLink>
        ).
      </p>
      <p>
        The RSSF software is open source. If someone else hosts a copy, that
        person operates that copy, and this policy does not apply to it.
      </p>

      <h2>Who this covers</h2>
      <ul>
        <li>
          <strong>Visitors</strong>, people who open the site.
        </li>
        <li>
          <strong>Owners</strong>, people who sign in with Google to create and
          manage forms.
        </li>
        <li>
          <strong>Respondents</strong>, people who open a published form and
          send answers. Respondents do not need an account.
        </li>
      </ul>

      <h2>What the service does</h2>
      <p>
        An owner describes what they want to collect. RSSF sends that
        description to Cloudflare Workers AI, which returns a form. The owner
        can edit the form, try it, publish a link, set an optional closing
        time, read answers, delete a submission, and download a CSV file.
      </p>

      <h2>Who decides about your data</h2>
      <p>
        For an owner’s account (the Google profile we store), Fabio Franchino
        is the data controller.
      </p>
      <p>
        For answers sent through a published form, the form owner chooses the
        questions and decides what the answers are used for. The owner is the
        controller of those answers. We store, display, and export them for
        that owner. If you submitted a form and want your answers corrected or
        deleted, contact the person who gave you the link. You can also contact
        us, and we will help where we can.
      </p>

      <h2>Data we process</h2>
      <h3>Account</h3>
      <p>
        When you choose “Continue with Google”, sign-in happens on Google.
        Google then sends us a Google account identifier, your email address,
        your name if Google provides one, and your profile picture URL if
        Google provides one. We store that profile and refresh it the next time
        you sign in. We use it to create your account, keep you signed in, and
        show your name and picture in the app. The picture is loaded from
        Google when it is shown. We never receive your Google password.
      </p>
      <p>
        Our use of information received from Google APIs follows the{" "}
        <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </ExternalLink>
        , including the Limited Use requirements. We do not sell Google user
        data, use it for advertising, or use it to train models.
      </p>

      <h3>Forms and prompts</h3>
      <p>
        We store each form you create: title, description, fields, theme,
        public address, draft or published status, optional expiry, and
        timestamps. The text you type to create or refine a form (up to 2,000
        characters) is sent to Cloudflare Workers AI so it can return a form
        definition. We keep the form that comes back. We do not keep a separate
        copy of each prompt after the form is saved.
      </p>

      <h3>Answers</h3>
      <p>
        A submission stores the answers the form asks for, the time it was
        sent, and whether the owner submitted it as a test. Fields can be short
        text, long text, email, number, date, dropdown, single choice, multiple
        choice, or yes/no. We do not add hidden questions. Owners can view
        submissions, delete one submission, and download that form’s
        submissions as CSV.
      </p>

      <h3>Abuse limits and logs</h3>
      <p>
        Public submissions are limited to 10 per form per hour from the same
        network. To apply that limit we read the connecting IP address provided
        by Cloudflare, hash it with SHA-256, and store the hash with the form
        id, a counter, and the start of the one-hour window. We do not store
        the raw IP address in our database for this check.
      </p>
      <p>
        Cloudflare also processes network data, including IP addresses, to
        deliver and protect the site. Workers observability and traces are
        enabled so the service can be operated. That processing is described in
        the{" "}
        <ExternalLink href="https://www.cloudflare.com/privacypolicy/">
          Cloudflare Privacy Policy
        </ExternalLink>
        .
      </p>

      <h2>Cookies and data on your device</h2>
      <p>
        We use only what is needed to sign you in or to remember a display
        setting you chose. We do not use analytics or advertising cookies.
      </p>
      <ul>
        <li>
          <strong>rssf_session</strong> — a random session id. The cookie is
          HttpOnly and SameSite=Lax, and Secure on HTTPS. It lasts 14 days.
          Signing out deletes the session.
        </li>
        <li>
          <strong>rssf_oauth_state</strong> — a random value used for about 10
          minutes during Google sign-in, so a forged login response is
          rejected. It is removed when sign-in finishes.
        </li>
        <li>
          <strong>rssf-appearance</strong> — your light or dark theme, stored
          in the browser’s local storage. It is not sent to our server.
        </li>
      </ul>
      <p>
        The typefaces are loaded from Google Fonts. Your browser requests them
        from fonts.googleapis.com and fonts.gstatic.com. Google describes that
        in the{" "}
        <ExternalLink href="https://developers.google.com/fonts/faq/privacy">
          Google Fonts privacy FAQ
        </ExternalLink>
        .
      </p>

      <h2>Why we use data</h2>
      <ul>
        <li>
          <strong>To provide the service.</strong> Account profile, forms, and
          stored answers are processed so we can do what you asked: sign you
          in, keep your forms, and hold answers for the owner. This is
          necessary for the service (GDPR Article 6(1)(b)).
        </li>
        <li>
          <strong>To keep the service reliable.</strong> Sessions, the sign-in
          check, the hashed network address, and Cloudflare logs are used to
          prevent abuse and to operate the site. This is our legitimate
          interest (GDPR Article 6(1)(f)). You can object, as described under
          “Your rights”.
        </li>
      </ul>
      <p>We do not use personal data for marketing, and we do not sell it.</p>

      <h2>Third parties</h2>
      <p>
        These providers process data under their own terms. Follow the links
        for the current text of each policy.
      </p>
      <ul>
        <li>
          <strong>Google</strong> — sign-in, profile picture, and the fonts
          your browser loads.{" "}
          <ExternalLink href="https://policies.google.com/privacy">
            Privacy Policy
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://policies.google.com/terms">
            Terms of Service
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
            API Services User Data Policy
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://developers.google.com/fonts/faq/privacy">
            Fonts privacy
          </ExternalLink>
        </li>
        <li>
          <strong>Cloudflare</strong> — the app runs on Cloudflare Workers.
          Accounts, sessions, forms, and answers are stored in Cloudflare D1.
          Prompts are processed by Cloudflare Workers AI.{" "}
          <ExternalLink href="https://www.cloudflare.com/privacypolicy/">
            Privacy Policy
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://www.cloudflare.com/terms/">
            Self-Serve Subscription Agreement
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://developers.cloudflare.com/workers-ai/platform/data-usage/">
            Workers AI data usage
          </ExternalLink>
          {" · "}
          <ExternalLink href="https://www.cloudflare.com/trust-hub/gdpr/">
            GDPR
          </ExternalLink>
        </li>
      </ul>
      <p>
        Workers AI runs a Meta Llama model on Cloudflare’s infrastructure
        (currently Llama 3.3). Prompts go to Cloudflare for that step. We do
        not send prompts or answers to Meta as a separate service. Cloudflare
        states that it does not use Workers AI customer content to train models
        or to improve its own or third-party services unless you consent.
        Cloudflare also states that model licences can apply between you and
        the model provider. The model used here is covered by the{" "}
        <ExternalLink href="https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE">
          Llama 3.3 Community License
        </ExternalLink>
        .
      </p>

      <h2>Where data is processed</h2>
      <p>
        Cloudflare and Google may process data in the United States and in
        other countries outside the European Economic Area. Their privacy
        policies describe the safeguards they use, including the EU–US Data
        Privacy Framework and standard contractual clauses where those apply.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>A session lasts up to 14 days, or until you sign out.</li>
        <li>The sign-in state cookie lasts about 10 minutes.</li>
        <li>
          Your profile, forms, and answers may be kept while the account and
          those forms exist. The terms of service do not promise that this data
          will remain available or intact, and it may be deleted if the service
          changes or ends.
        </li>
        <li>
          An owner can delete one submission from the results page. The app has
          no button that deletes a whole account. To delete your account, your
          forms, and the answers stored with them, contact Fabio Franchino
          through{" "}
          <ExternalLink href="https://fabiofranchino.com">
            fabiofranchino.com
          </ExternalLink>
          . We delete that data unless a specific record must be kept to meet a
          legal duty.
        </li>
        <li>
          Hashed rate-limit records are kept only to enforce the hourly limit.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        Session ids are random and stored in HttpOnly cookies. Owner APIs
        return only the forms that belong to the signed-in account. A public
        link shows that form’s questions. It does not show the owner’s email
        or the answers already collected. No method of sending or storing data
        is perfectly secure.
      </p>

      <h2>Your rights</h2>
      <p>
        If the GDPR applies to you, you can ask to access, correct, erase, or
        restrict your personal data, and you can ask for a portable copy of
        data you provided. You can object to processing based on legitimate
        interests. Where a request concerns answers on someone else’s form, we
        may need to refer you to that form’s owner, who decides the questions
        and the purpose.
      </p>
      <p>
        Contact Fabio Franchino through{" "}
        <ExternalLink href="https://fabiofranchino.com">
          fabiofranchino.com
        </ExternalLink>
        . We may ask you to confirm that you are the person the data is about.
      </p>
      <p>
        You can also complain to a supervisory authority. In Italy, that
        authority is the{" "}
        <ExternalLink href="https://www.garanteprivacy.it/">
          Garante per la protezione dei dati personali
        </ExternalLink>
        . If you live elsewhere in the European Economic Area, you can contact{" "}
        <ExternalLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">
          your local authority
        </ExternalLink>
        .
      </p>

      <h2>Children</h2>
      <p>
        RSSF is not directed at anyone under 16. Owners must not use it to
        collect personal data from children.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the new version will be posted on this page
        with a new “Last updated” date. The{" "}
        <Link to="/terms">terms of service</Link> explain the rules for using
        RSSF.
      </p>

      <h2>Contact</h2>
      <p>
        Fabio Franchino
        <br />
        <ExternalLink href="https://fabiofranchino.com">
          fabiofranchino.com
        </ExternalLink>
      </p>
    </LegalDocument>
  );
}
