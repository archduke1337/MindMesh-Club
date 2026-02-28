"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  ArrowLeftIcon,
  PlusIcon,
  TicketPercentIcon,
  CopyIcon,
  CheckIcon,
  EditIcon,
} from "lucide-react";

interface CouponData {
  $id: string;
  code: string;
  description: string | null;
  type: "percentage" | "fixed";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  scope: "global" | "event";
  eventId: string | null;
  eventName: string | null;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdBy: string;
}

export default function AdminCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);

  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    minPurchase: 0,
    maxDiscount: 0,
    scope: "global" as "global" | "event",
    eventId: "",
    eventName: "",
    usageLimit: 0,
    perUserLimit: 1,
    validFrom: "",
    validUntil: "",
  });

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons?all=true");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) { router.push("/unauthorized"); return; }
    if (isAdmin) {
      loadCoupons();
      // Load events for event-scoped coupons
      fetch("/api/events/register")
        .then((r) => r.json())
        .then((data) => setEvents(data.events || data || []))
        .catch(() => {});
    }
  }, [authLoading, isAdmin, loadCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    const now = new Date();
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setForm({
      code: "", description: "", type: "percentage", value: 10,
      minPurchase: 0, maxDiscount: 0, scope: "global", eventId: "",
      eventName: "", usageLimit: 0, perUserLimit: 1,
      validFrom: now.toISOString().slice(0, 16),
      validUntil: oneMonth.toISOString().slice(0, 16),
    });
    modal.onOpen();
  };

  const openEditModal = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase,
      maxDiscount: coupon.maxDiscount || 0,
      scope: coupon.scope,
      eventId: coupon.eventId || "",
      eventName: coupon.eventName || "",
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      validFrom: coupon.validFrom?.slice(0, 16) || "",
      validUntil: coupon.validUntil?.slice(0, 16) || "",
    });
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.code) return;
    setSaving(true);
    try {
      if (editingCoupon) {
        // Update
        await fetch("/api/coupons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponId: editingCoupon.$id,
            description: form.description || null,
            value: form.value,
            minPurchase: form.minPurchase,
            maxDiscount: form.maxDiscount || null,
            usageLimit: form.usageLimit,
            perUserLimit: form.perUserLimit,
            validFrom: form.validFrom,
            validUntil: form.validUntil,
          }),
        });
      } else {
        // Create
        const selectedEvent = events.find((e) => e.$id === form.eventId);
        await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...form,
            eventName: selectedEvent?.title || form.eventName,
            maxDiscount: form.maxDiscount || null,
            createdBy: user?.$id || "",
          }),
        });
      }
      modal.onClose();
      await loadCoupons();
    } catch (err: any) {
      alert(err.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: CouponData) => {
    await fetch("/api/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponId: coupon.$id, isActive: !coupon.isActive }),
    });
    await loadCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (coupon: CouponData) =>
    coupon.validUntil && new Date(coupon.validUntil) < new Date();

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push("/admin")}
        className="mb-6"
      >
        Back to Admin
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <TicketPercentIcon className="w-7 h-7 text-success" />
            Discount Coupons
          </h1>
          <p className="text-default-500 mt-1">{coupons.length} coupons • {coupons.filter((c) => c.isActive).length} active</p>
        </div>
        <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />} onPress={openCreateModal}>
          Create Coupon
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.$id} className={`border-none shadow-md ${!coupon.isActive ? "opacity-60" : ""}`}>
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  {/* Coupon Badge */}
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold flex-shrink-0 ${
                    coupon.type === "percentage"
                      ? "bg-gradient-to-br from-success to-emerald-400"
                      : "bg-gradient-to-br from-primary to-blue-400"
                  }`}>
                    <span className="text-lg">{coupon.value}</span>
                    <span className="text-[10px]">{coupon.type === "percentage" ? "% OFF" : "₹ OFF"}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-bold text-sm bg-default-100 px-2 py-0.5 rounded">{coupon.code}</code>
                      <Button isIconOnly size="sm" variant="light" onPress={() => copyCode(coupon.code)}>
                        {copiedCode === coupon.code ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </Button>
                      <Chip size="sm" variant="flat" color={coupon.scope === "global" ? "primary" : "secondary"}>
                        {coupon.scope === "global" ? "All Events" : coupon.eventName || "Event"}
                      </Chip>
                      {!coupon.isActive && <Chip size="sm" color="danger" variant="flat">Inactive</Chip>}
                      {isExpired(coupon) && <Chip size="sm" color="warning" variant="flat">Expired</Chip>}
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-default-400 mb-1">{coupon.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-default-400">
                      <span>Used: {coupon.usedCount}/{coupon.usageLimit || "∞"}</span>
                      {coupon.minPurchase > 0 && <span>Min: ₹{coupon.minPurchase}</span>}
                      {coupon.maxDiscount && <span>Max: ₹{coupon.maxDiscount}</span>}
                      <span>Per user: {coupon.perUserLimit || "∞"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      size="sm"
                      isSelected={coupon.isActive}
                      onValueChange={() => toggleActive(coupon)}
                    />
                    <Button isIconOnly size="sm" variant="light" onPress={() => openEditModal(coupon)}>
                      <EditIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {coupons.length === 0 && (
            <div className="text-center py-12 text-default-400">
              <TicketPercentIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No coupons created yet</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input variant="bordered"
                    label="Coupon Code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    isRequired
                    variant="bordered"
                    placeholder="e.g. EARLYBIRD50"
                    isDisabled={!!editingCoupon}
                    description={editingCoupon ? "Code cannot be changed" : "Must be unique"}
                  />
                  <Input variant="bordered"
                    label="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    variant="bordered"
                    placeholder="e.g. Early bird discount for hackathon"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select variant="bordered"
                      label="Discount Type"
                      selectedKeys={[form.type]}
                      onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
                      variant="bordered"
                    >
                      <SelectItem key="percentage" variant="bordered">Percentage (%)</SelectItem>
                      <SelectItem key="fixed" variant="bordered">Fixed Amount (₹)</SelectItem>
                    </Select>
                    <Input variant="bordered"
                      label={form.type === "percentage" ? "Percentage Off" : "Amount Off (₹)"}
                      type="number"
                      value={String(form.value)}
                      onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                      variant="bordered"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input variant="bordered"
                      label="Min Purchase (₹)"
                      type="number"
                      value={String(form.minPurchase)}
                      onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                      variant="bordered"
                      description="0 = no minimum"
                    />
                    {form.type === "percentage" && (
                      <Input variant="bordered"
                        label="Max Discount (₹)"
                        type="number"
                        value={String(form.maxDiscount)}
                        onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                        variant="bordered"
                        description="0 = no cap"
                      />
                    )}
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 gap-4">
                    <Select variant="bordered"
                      label="Scope"
                      selectedKeys={[form.scope]}
                      onChange={(e) => setForm({ ...form, scope: e.target.value as "global" | "event" })}
                      variant="bordered"
                    >
                      <SelectItem key="global" variant="bordered">All Events (Global)</SelectItem>
                      <SelectItem key="event" variant="bordered">Specific Event</SelectItem>
                    </Select>
                    {form.scope === "event" && (
                      <Select variant="bordered"
                        label="Event"
                        selectedKeys={form.eventId ? [form.eventId] : []}
                        onChange={(e) => {
                          const ev = events.find((x) => x.$id === e.target.value);
                          setForm({ ...form, eventId: e.target.value, eventName: ev?.title || "" });
                        }}
                        variant="bordered"
                      >
                        {events.map((ev) => (
                          <SelectItem key={ev.$id} variant="bordered">{ev.title}</SelectItem>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input variant="bordered"
                      label="Usage Limit"
                      type="number"
                      value={String(form.usageLimit)}
                      onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                      variant="bordered"
                      description="0 = unlimited"
                    />
                    <Input variant="bordered"
                      label="Per User Limit"
                      type="number"
                      value={String(form.perUserLimit)}
                      onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                      variant="bordered"
                      description="0 = unlimited"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input variant="bordered"
                      label="Valid From"
                      type="datetime-local"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      variant="bordered"
                    />
                    <Input variant="bordered"
                      label="Valid Until"
                      type="datetime-local"
                      value={form.validUntil}
                      onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                      variant="bordered"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={saving}
                  isDisabled={!form.code || !form.validFrom || !form.validUntil}
                >
                  {editingCoupon ? "Update" : "Create Coupon"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
