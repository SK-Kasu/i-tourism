import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import OwnerLayout from "../../components/owner/OwnerLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useCreateProperty, useCreateRoom, useMyProperties } from "../../hooks/useOwner.js";
import { propertySchema, roomSchema } from "../../lib/validators.js";
import { AMENITIES, REGIONS } from "../../lib/constants.js";
import { formatCurrency } from "../../lib/utils.js";

function PropertyStep({ onCreated }) {
  const createProperty = useCreateProperty();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(propertySchema), defaultValues: { name: "", region: "", county: "" } });
  const region = watch("region");

  async function onSubmit(values) {
    try {
      const property = await createProperty.mutateAsync(values);
      onCreated(property.id);
    } catch {
      /* the hook already showed a toast */
    }
  }

  return (
    <Card className="max-w-xl">
      <h2 className="text-heading-md text-ink-900 mb-1">Step 1 of 2: Property details</h2>
      <p className="text-body text-ink-600 mb-4">Tell travelers where your hotel, lodge or guesthouse is.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Property name" placeholder="Lakeview Guesthouse" error={errors.name?.message} {...register("name")} />
        <Select label="Region" error={errors.region?.message} {...register("region")}>
          <option value="">Choose a region</option>
          {Object.keys(REGIONS).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Select label="County / town" error={errors.county?.message} disabled={!region} {...register("county")}>
          <option value="">{region ? "Choose a county" : "Choose a region first"}</option>
          {(REGIONS[region] || []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Button type="submit" disabled={createProperty.isPending}>
          {createProperty.isPending ? "Saving..." : "Continue to rooms"}
        </Button>
      </form>
    </Card>
  );
}

function RoomStep({ property, onFinish }) {
  const createRoom = useCreateRoom();
  const [added, setAdded] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: "", pricePerNight: "", maxOccupancy: "", amenities: [] },
  });

  async function onSubmit(values) {
    try {
      const room = await createRoom.mutateAsync({ propertyId: property.id, ...values });
      setAdded((list) => [...list, room]);
      toast.success(`${room.name} added`);
      reset({ name: "", pricePerNight: "", maxOccupancy: "", amenities: [] });
    } catch {
      /* the hook already showed a toast */
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px] max-w-4xl">
      <Card>
        <h2 className="text-heading-md text-ink-900 mb-1">Step 2 of 2: Add a room type</h2>
        <p className="text-body text-ink-600 mb-4">
          For <strong>{property.name}</strong>. Add one entry per kind of room, for example Standard single or Family suite.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label="Room name" placeholder="Deluxe double" error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price per night (KES)" type="number" inputMode="numeric" error={errors.pricePerNight?.message} {...register("pricePerNight")} />
            <Input label="Max guests" type="number" inputMode="numeric" error={errors.maxOccupancy?.message} {...register("maxOccupancy")} />
          </div>
          <fieldset>
            <legend className="text-label-sm text-ink-600 uppercase mb-1">Amenities</legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 text-body text-ink-600">
                  <input type="checkbox" value={a} {...register("amenities")} className="accent-primary-500" />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? "Saving..." : "Save room"}
            </Button>
            <Button type="button" variant="secondary" onClick={onFinish}>
              {added.length ? "Finish" : "Skip for now"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="self-start">
        <h3 className="text-heading-md text-ink-900 mb-2">Added just now</h3>
        {added.length === 0 ? (
          <p className="text-body text-ink-600">No rooms yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {added.map((r) => (
              <li key={r.id} className="text-body text-ink-900">
                {r.name}
                <span className="block text-xs text-ink-600">
                  {formatCurrency(r.pricePerNight)} · up to {r.maxOccupancy}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const propertyId = params.get("propertyId") || "";
  const { data: properties, isLoading } = useMyProperties();
  const property = properties?.find((p) => p.id === propertyId);

  return (
    <OwnerLayout title="Add a listing">
      {propertyId && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      )}

      {!propertyId && <PropertyStep onCreated={(id) => setParams({ propertyId: id })} />}

      {propertyId && !isLoading && !property && (
        <p className="text-danger-500">We could not find that property among your listings.</p>
      )}

      {property && <RoomStep key={property.id} property={property} onFinish={() => navigate("/owner/dashboard")} />}
    </OwnerLayout>
  );
}
