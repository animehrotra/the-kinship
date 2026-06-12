import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, hsl(30 25% 97.5%) 0%, hsl(30 30% 95.5%) 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kinship
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-lg tracking-tight">Kinship</span>
        </div>

        <h1 className="font-serif text-3xl tracking-tight mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">What we collect</h2>
            <p>
              When you sign up, we store your email address and any profile information you
              choose to provide (such as your display name). As you use Kinship, you create
              contact records, interaction logs, life events, tags, and notes. We also store
              optional push-notification subscription details if you enable reminders.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">How we store your data</h2>
            <p>
              All data is stored in our secure backend database. Access is protected by
              authentication, and your contact and interaction data is isolated so only you can
              read or modify it. We use industry-standard encryption for data in transit.&nbsp;
              Your data is stored via Supabase, a secure and trusted cloud database provider
              that meets industry-standard security and compliance requirements
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">What we do not do</h2>
            <p>
              <strong className="text-foreground">We never sell your data.</strong> We do not
              share your contacts, interactions, or personal information with advertisers, data
              brokers, or third parties for marketing purposes. We do not use your relationship
              data to train machine-learning models.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">Analytics and cookies</h2>
            <p>
              We do not use third-party analytics trackers or advertising cookies. The only
              cookies we use are those required to keep you signed in.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">Your rights</h2>
            <p>
              You can delete your account and all associated data at any time by deleting
              contacts individually or contacting us. If you have questions about this policy,
              reach out through the feedback link inside the app.&nbsp;To delete your account
              and all associated data completely, including your email address and profile,
              please contact us directly and we will permanently remove your data from our
              systems within 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-medium text-lg mb-2">Changes to this policy</h2>
            <p>
              We may update this policy as the app evolves. If we make material changes, we
              will notify you inside the app.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
