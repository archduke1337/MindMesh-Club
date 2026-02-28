import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <ShieldX className="w-12 h-12 text-warning" />
          <h1 className="text-xl font-bold">Access Denied</h1>
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-4 pb-6">
          <p className="text-default-500 text-center text-sm">
            You are not authorized to view this page. Please contact an administrator if you believe this is an error.
          </p>
          <Button as={Link} href="/" color="primary" variant="shadow">
            Go Home
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
