import { useState } from "react";
import toast from "react-hot-toast";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

const PLACES = ["Kisumu", "Kakamega", "Kisii", "Homa Bay", "Migori", "Siaya", "Bungoma", "Busia", "Vihiga", "Nyanza", "Western"];
const today = () => new Date().toISOString().slice(0, 10);

export default function SearchBar({ initial, onSearch }) {
  const [q, setQ] = useState(initial.q || "");
  const [checkIn, setCheckIn] = useState(initial.checkIn || "");
  const [checkOut, setCheckOut] = useState(initial.checkOut || "");

  function submit(e) {
    e.preventDefault();
    if ((checkIn || checkOut) && !(checkIn && checkOut)) {
      return toast.error("Choose both check-in and check-out dates");
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      return toast.error("Check-out must be after check-in");
    }
    onSearch({ q: q.trim(), checkIn, checkOut });
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-card shadow-card border border-surface-border p-4
        grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <Input
          label="Destination"
          list="places"
          placeholder="Kisumu, Kakamega..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <datalist id="places">
          {PLACES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <Input label="Check-in" type="date" min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      <Input label="Check-out" type="date" min={checkIn || today()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
      <Button type="submit" className="sm:col-span-2 lg:col-span-1">
        Find stays
      </Button>
    </form>
  );
}
