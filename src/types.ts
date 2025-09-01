export type ID = string;

export interface Client {
    id: ID;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    createdAt: string;

    hasPaid: boolean;
    hasKeys: boolean;
}

export type UnitStatus = "available" | "rented" | "maintenance";

export interface Unit {
    id: ID;
    label: string;
    size?: string;
    status: UnitStatus;
}

export interface Contract {
    id: ID;
    clientId: ID;
    unitId: ID;
    startDate: string;
    endDate?: string;
    monthlyRate: number;
}

export interface Payment {
    id: ID;
    contractId: ID;
    date: string;
    amount: number;
}
