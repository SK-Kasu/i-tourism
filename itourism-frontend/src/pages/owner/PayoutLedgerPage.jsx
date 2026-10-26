import OwnerLayout from "../../components/owner/OwnerLayout.jsx";
import Card from "../../components/ui/Card.jsx";

// Sprint 6: gross, commission, net and status per booking (technical documentation Section 6.4).
export default function PayoutLedgerPage() {
  return (
    <OwnerLayout title="Payouts">
      <Card className="max-w-xl">
        <p className="text-body text-ink-900 font-medium">Payouts are coming soon.</p>
        <p className="text-body text-ink-600 mt-1">
          Once a guest has stayed, your share of each booking, our commission and the payment status will appear here.
        </p>
      </Card>
    </OwnerLayout>
  );
}
