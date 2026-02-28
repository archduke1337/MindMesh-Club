"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <AlertCircle className="w-12 h-12 text-danger" />
          <h2 className="text-xl font-bold text-danger">Something went wrong!</h2>
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-4 pb-6">
          <p className="text-default-500 text-center text-sm">
            {process.env.NODE_ENV === "development"
              ? error.message || "An unexpected error occurred."
              : "An unexpected error occurred. Please try again."}
          </p>
          <Button color="primary" variant="shadow" onPress={() => reset()}>
            Try again
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
