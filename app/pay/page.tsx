'use server'
import { Suspense } from "react";
import WrappedPaymentPageContent from "@/components/pages/pay"; // HOC로 래핑된 컴포넌트
import { Loading } from "@/components/Loading";

interface PaymentData {
    to: string;
    amount: string;
    token: string;
    message: string;
    recipient: string;
    broadcastLink: string;
}

interface PaymentPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

interface WrappedPaymentPageContentProps {
    paymentData: PaymentData | null;
}


export default async function PaymentPage({ searchParams }: PaymentPageProps) {
    const params = await searchParams
    const data = params.data;
    let paymentData: PaymentData | null = null;
    try {
        if (data && typeof data === "string") {
            paymentData = JSON.parse(decodeURIComponent(data));
        }
    } catch (error) {
        console.error("Error parsing payment data:", error);
        // paymentData가 null이면 컴포넌트에서 에러 UI를 렌더링
    }

    return (
        <Suspense fallback={<Loading />}>
            <WrappedPaymentPageContent
                paymentData={paymentData} />
        </Suspense>
    );
}