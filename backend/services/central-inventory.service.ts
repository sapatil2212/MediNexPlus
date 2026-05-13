import * as repo from "../repositories/central-inventory.repo";

// ─── Locations ───
export const createLocation = async (hospitalId: string, data: any) => {
  return repo.createLocation({ ...data, hospitalId });
};

export const updateLocation = async (id: string, hospitalId: string, data: any) => {
  return repo.updateLocation(id, hospitalId, data);
};

export const getLocations = async (hospitalId: string) => {
  return repo.getLocations(hospitalId);
};

export const deleteLocation = async (id: string, hospitalId: string) => {
  return repo.deleteLocation(id, hospitalId);
};

export const ensureCentralLocation = async (hospitalId: string) => {
  return repo.ensureCentralLocation(hospitalId);
};

// ─── Transfers ───
export const createTransfer = async (hospitalId: string, data: any) => {
  const transferNo = await repo.generateTransferNo(hospitalId);
  const { items, ...transferData } = data;
  return repo.createTransfer(
    { ...transferData, hospitalId, transferNo, status: "PENDING" },
    items
  );
};

export const getTransfers = async (params: any) => {
  return repo.getTransfers(params);
};

export const getTransferById = async (id: string, hospitalId: string) => {
  return repo.getTransferById(id, hospitalId);
};

export const approveTransfer = async (id: string, hospitalId: string, approvedBy: string) => {
  return repo.approveTransfer(id, hospitalId, approvedBy);
};

export const rejectTransfer = async (id: string, hospitalId: string, approvedBy: string) => {
  return repo.rejectTransfer(id, hospitalId, approvedBy);
};

export const cancelTransfer = async (id: string, hospitalId: string, cancelledBy: string) => {
  return repo.cancelTransfer(id, hospitalId, cancelledBy);
};

export const updateTransferItems = async (
  id: string,
  hospitalId: string,
  updatedItems: { transferItemId: string; newQty: number }[],
  updatedBy: string
) => {
  return repo.updateTransferItems(id, hospitalId, updatedItems, updatedBy);
};

// ─── Returns ───
export const createReturn = async (hospitalId: string, data: any) => {
  const returnNo = await repo.generateReturnNo(hospitalId);
  return repo.createReturn({ ...data, hospitalId, returnNo, status: "PENDING" });
};

export const getReturns = async (params: any) => {
  return repo.getReturns(params);
};

export const approveReturn = async (id: string, hospitalId: string, approvedBy: string) => {
  return repo.approveReturn(id, hospitalId, approvedBy);
};

export const rejectReturn = async (id: string, hospitalId: string, approvedBy: string) => {
  return repo.rejectReturn(id, hospitalId, approvedBy);
};

// ─── Quick Transfer to Department ───
export const quickTransferToDept = async (
  hospitalId: string,
  subDepartmentId: string,
  subDeptName: string,
  items: { itemId: string; quantity: number }[],
  userId: string,
  notes?: string
) => {
  // 1. Ensure Central Store location exists
  const centralLoc = await repo.ensureCentralLocation(hospitalId);

  // 2. Ensure department location exists (auto-create if missing)
  const deptLoc = await repo.ensureDeptLocation(hospitalId, subDepartmentId, subDeptName);

  // 3. Create transfer
  const transferNo = await repo.generateTransferNo(hospitalId);
  const transfer = await repo.createTransfer(
    {
      hospitalId,
      transferNo,
      fromLocationId: centralLoc.id,
      toLocationId: deptLoc.id,
      requestedBy: userId,
      notes: notes || `Quick transfer to ${subDeptName}`,
      status: "PENDING",
    },
    items
  );

  // 4. Auto-approve immediately
  const approved = await repo.approveTransfer(transfer.id, hospitalId, userId);
  return { transfer: approved, location: deptLoc };
};

// ─── Department Stock ───
export const getDeptWiseStock = async (hospitalId: string) => {
  return repo.getDeptWiseStock(hospitalId);
};

export const getLocationStockForDept = async (hospitalId: string, subDepartmentId: string) => {
  return repo.getLocationStockForDept(hospitalId, subDepartmentId);
};

export const getLocationForSubDept = async (hospitalId: string, subDepartmentId: string) => {
  return repo.getLocationForSubDept(hospitalId, subDepartmentId);
};

// ─── Reports ───
export const getInventoryReport = async (hospitalId: string) => {
  return repo.getInventoryReport(hospitalId);
};
