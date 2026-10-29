-- At most one APPROVED or ACTIVE rental per property
-- CreateIndex
CREATE UNIQUE INDEX "one_active_rental_per_property" ON "rental_requests"("propertyId") WHERE ("status" IN ('APPROVED', 'ACTIVE'));

-- At most one open request per tenant per property
-- CreateIndex
CREATE UNIQUE INDEX "one_open_request_per_tenant_property" ON "rental_requests"("tenantId", "propertyId") WHERE ("status" IN ('PENDING', 'APPROVED', 'ACTIVE'));
