import { Link } from "react-router-dom";
import { ExternalLink } from "../ExternalLink";
import { LegalDocument } from "../legal";

export function TermsPage() {
  return (
    <LegalDocument title="Terms of service">
      <p>
        These terms are an agreement between you and Fabio Franchino (
        <ExternalLink href="https://fabiofranchino.com">
          fabiofranchino.com
        </ExternalLink>
        ) for the hosted RSSF service (“RSSF”, “the service”). By signing in,
        creating a form, or submitting a published form, you agree to them. The{" "}
        <Link to="/privacy">privacy policy</Link> explains how personal data is
        handled.
      </p>
      <p>
        If you run your own copy of the open-source software, these terms do
        not apply to that copy. Whoever operates that copy sets the terms for
        it.
      </p>

      <h2>The service</h2>
      <p>
        RSSF lets a signed-in owner describe a form, generate and edit it,
        publish a link, collect answers, and export them. Anyone with the link
        can submit without an account. A form can be set to stop accepting
        answers at a chosen time.
      </p>
      <p>
        The service is offered at no charge. It depends on Cloudflare,
        including plan limits that can pause features until they reset. Because
        it is free, it comes with no service commitment of any kind.
      </p>

      <h2>No guarantee</h2>
      <p>
        RSSF is provided “as is” and “as available”, with no guarantee. You
        have no right to reliability, availability, uptime, performance,
        support, continuation of the service, or to any feature remaining as it
        is. You have no right to data integrity. Forms, prompts, answers,
        exports, and accounts may be lost, corrupted, delayed, incomplete, or
        deleted. We do not promise backups, recovery, or that stored data will
        still be there later.
      </p>
      <p>
        Fabio Franchino may, at any time and for any reason, with or without
        notice and without owing you anything: change, limit, or remove
        features; refuse, suspend, or close any account; unpublish or delete
        any form; delete prompts, submissions, and other stored data; and
        suspend or stop the service entirely.
      </p>
      <p>
        Keep your own copy of anything you cannot afford to lose. Use of the
        service is acceptance of that risk.
      </p>

      <h2>Who can use it</h2>
      <p>
        You need to be able to enter a contract. Do not use RSSF if you are
        under 16. If you use it for an organisation, you confirm that you can
        agree to these terms for that organisation.
      </p>

      <h2>Accounts</h2>
      <p>
        Owners sign in with Google. You are responsible for the Google account
        you use and for activity in your session. Sign out on a shared device.
        We may refuse, suspend, or close an account that breaks these terms or
        puts the service or other people at risk.
      </p>

      <h2>Your content</h2>
      <p>
        You keep your rights in the prompts you write, the forms you build, and
        the answers you collect. You grant us a non-exclusive licence to host,
        store, display, and process that material only to run the service for
        you. That includes sending a prompt to Cloudflare Workers AI to
        generate or revise a form. The licence does not oblige us to keep the
        material.
      </p>
      <p>
        You confirm that you have the rights, and any legal basis, required for
        what you submit, including answers you collect from other people.
      </p>

      <h2>If you publish a form</h2>
      <p>You are responsible for every form you publish.</p>
      <ul>
        <li>Ask only for information you have a fair reason to collect.</li>
        <li>
          Tell respondents who you are and what you will do with their answers.
          A published RSSF page does not name you on its own.
        </li>
        <li>
          Do not request special-category data (for example health, biometric,
          or similarly sensitive information), government identity numbers,
          payment card numbers, or passwords.
        </li>
        <li>Do not use a form to collect personal data from children.</li>
        <li>
          Respond to people who ask to access or delete their answers. You can
          delete a submission from the results page and download a CSV.
        </li>
        <li>
          You are the controller of respondent data. Read the{" "}
          <Link to="/privacy">privacy policy</Link> for how the service stores
          it.
        </li>
      </ul>

      <h2>If you submit a form</h2>
      <p>
        Sending a form delivers your answers to that form’s owner through RSSF.
        The owner chooses the questions. Read the form before you send it. For
        a question about one form, contact the owner. The privacy policy
        explains what the service itself stores.
      </p>

      <h2>Acceptable use</h2>
      <p>Do not use RSSF to:</p>
      <ul>
        <li>break the law, or infringe someone else’s rights</li>
        <li>
          phish, impersonate a person or organisation, or collect credentials
          or payment data
        </li>
        <li>send spam, or publish a form that misleads people</li>
        <li>
          distribute malware, or probe, overload, or disrupt the service
        </li>
        <li>
          bypass rate limits, or try to reach another owner’s forms or answers
        </li>
        <li>
          generate or publish unlawful, hateful, or sexually exploitative
          content
        </li>
      </ul>
      <p>
        We may unpublish a form, remove submissions, or end access when we
        reasonably believe these rules have been broken.
      </p>

      <h2>AI-generated forms</h2>
      <p>
        Creating and revising a form uses Cloudflare Workers AI and a Meta Llama
        model. The result can be incomplete or wrong. Review the form before
        you publish it. You are responsible for the questions you publish and
        for the answers you collect. AI output is not warranted to be accurate,
        fit for a particular purpose, or free of third-party rights.
      </p>

      <h2>Third-party services</h2>
      <p>The hosted service depends on:</p>
      <ul>
        <li>
          <ExternalLink href="https://policies.google.com/terms">
            Google
          </ExternalLink>{" "}
          for sign-in, and{" "}
          <ExternalLink href="https://developers.google.com/fonts/faq/privacy">
            Google Fonts
          </ExternalLink>{" "}
          for typefaces loaded by the browser
        </li>
        <li>
          <ExternalLink href="https://www.cloudflare.com/terms/">
            Cloudflare
          </ExternalLink>
          , including Workers, D1, and{" "}
          <ExternalLink href="https://developers.cloudflare.com/workers-ai/platform/data-usage/">
            Workers AI
          </ExternalLink>
        </li>
      </ul>
      <p>
        Their terms govern their own services. We are not responsible for an
        outage or a decision made by Google or Cloudflare. The Llama model is
        used under the{" "}
        <ExternalLink href="https://github.com/meta-llama/llama-models/blob/main/models/llama3_3/LICENSE">
          Llama 3.3 Community License
        </ExternalLink>
        .
      </p>

      <h2>Open source</h2>
      <p>
        The RSSF source code is licensed under the MIT License. That licence
        covers the code. These terms cover use of the hosted service. The MIT
        License does not let you use Fabio Franchino’s name to suggest an
        endorsement.
      </p>

      <h2>Disclaimers</h2>
      <p>
        To the extent the law allows, we disclaim every warranty, including
        merchantability, fitness for a particular purpose, non-infringement,
        reliability, availability, continuity, security, and data integrity. We
        do not warrant that the service, forms, AI output, storage, or exports
        will be error-free, complete, or available, or that data will be
        preserved.
      </p>
      <p>
        A rule that the law does not let us waive still applies, including a
        mandatory consumer right in your country of residence. That does not
        create a right to a reliable, continuing, or data-safe service.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, Fabio Franchino is not liable for any
        unavailability, interruption, change, or end of the service, or for
        lost, corrupted, delayed, or deleted data, forms, answers, or exports.
        He is also not liable for indirect, incidental, special, consequential,
        or punitive damages, or for lost profits or goodwill.
      </p>
      <p>
        Where the law allows a cap, total liability related to the service is
        limited to fifty euros (€50), because the service is provided free of
        charge.
      </p>
      <p>
        This section does not limit liability for intent, gross negligence,
        death or personal injury caused by negligence, or any other liability
        that cannot legally be limited.
      </p>

      <h2>Stopping</h2>
      <p>
        You may stop using RSSF at any time. Sign out to end the session on
        that browser. To ask for deletion of your account and the forms and
        answers stored with it, use the contact in the privacy policy. A
        deletion request does not oblige us to have kept that data until you
        asked.
      </p>
      <p>
        We may suspend or close access, or delete stored data, at any time,
        including if you break these terms, for security or a legal reason, or
        because the service changes or ends.
      </p>

      <h2>Changes</h2>
      <p>
        If these terms change, the new version will be posted on this page and
        the “Last updated” date will change. Continuing to use the service
        after that means you accept the new terms. If you do not accept them,
        stop using the service and ask us to delete your account.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the laws of Italy, without regard to
        conflict-of-law rules. The courts of Italy have jurisdiction, except
        where a mandatory consumer rule gives you the right to bring a claim in
        the courts of your residence in the European Union.
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
