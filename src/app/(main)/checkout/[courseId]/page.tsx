"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { CreditCard, Lock, Tag, BookOpen, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { ROUTES } from "@/lib/constants/routes";
import { formatPrice } from "@/lib/utils";

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "Invalid card number").max(19),
  cardHolder: z.string().min(2, "Card holder name required"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Format: MM/YY"),
  cvv: z.string().min(3).max(4),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Placeholder course data
const course = {
  id: "1",
  title: "Complete Web Development Bootcamp",
  instructor: "John Smith",
  price: 49.99,
  originalPrice: 99.99,
  totalLectures: 120,
  totalDuration: "20h",
};

export default function CheckoutPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<PaymentFormData>({ resolver: zodResolver(paymentSchema) });

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "LEARN20") {
      setDiscount(10);
      setPromoApplied(true);
      toast.success("Promo code applied! $10 off.");
    } else {
      toast.error("Invalid promo code.");
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    // TODO: wire up PaymentService.createOrder and verifyPayment
    console.log("Payment:", data);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Payment successful! You're now enrolled.");
    router.push(ROUTES.COURSE_DETAIL(params.courseId));
  };

  const finalPrice = course.price - discount;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Checkout" description="Complete your enrollment securely." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" /> Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Card Number</label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    {...register("cardNumber")}
                  />
                  {errors.cardNumber && <p className="text-xs text-[var(--color-danger)]">{errors.cardNumber.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Card Holder Name</label>
                  <Input placeholder="John Doe" {...register("cardHolder")} />
                  {errors.cardHolder && <p className="text-xs text-[var(--color-danger)]">{errors.cardHolder.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Expiry Date</label>
                    <Input placeholder="MM/YY" maxLength={5} {...register("expiry")} />
                    {errors.expiry && <p className="text-xs text-[var(--color-danger)]">{errors.expiry.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">CVV</label>
                    <Input placeholder="123" type="password" maxLength={4} {...register("cvv")} />
                    {errors.cvv && <p className="text-xs text-[var(--color-danger)]">{errors.cvv.message}</p>}
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" loading={isSubmitting} size="lg">
                  <Lock className="h-4 w-4" />
                  Pay {formatPrice(finalPrice)} Securely
                </Button>

                <p className="text-xs text-center text-[var(--muted-foreground)]">
                  🔒 Your payment is encrypted and secure
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--color-primary-50)]">
                  <BookOpen className="h-7 w-7 text-[var(--color-primary-600)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{course.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{course.instructor}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {course.totalLectures} lectures · {course.totalDuration}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Original Price</span>
                  <span className="line-through text-[var(--muted-foreground)]">
                    {formatPrice(course.originalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Discounted Price</span>
                  <span>{formatPrice(course.price)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Code</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[var(--color-primary-600)]">{formatPrice(finalPrice)}</span>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Promo Code
                </label>
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    disabled={promoApplied}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyPromo}
                    disabled={promoApplied || !promoCode}
                  >
                    Apply
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Code applied!
                  </p>
                )}
              </div>

              {/* Guarantee */}
              <div className="rounded-[var(--radius)] bg-[var(--muted)] p-3 text-xs text-[var(--muted-foreground)]">
                ✅ 30-day money-back guarantee. No questions asked.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
