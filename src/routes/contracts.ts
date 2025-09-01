import { Router } from "express";
import Contracts from "../models/Contracts";
import Clients from "../models/Clients";
import Units from "../models/Units";

const router = Router();

// GET all contracts
router.get("/", async (req, res) => {
    try {
        const contracts = await Contracts.find({ createdBy: req.user.id })
            .populate('clientId', 'name email phone')
            .populate('unitId', 'name monthlyRate')
            .sort({ createdAt: -1 });
        res.json(contracts);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ error: errorMessage });
    }
});

// Generate draft contract
router.post("/draft/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;
        const { unitId, monthlyRate, startDate, endDate } = req.body;

        // Validate required fields
        if (!unitId || !monthlyRate || !startDate) {
            return res.status(400).json({ error: "Unit, monthly rate, and start date are required" });
        }

        // Check if client exists and belongs to user
        const client = await Clients.findOne({ _id: clientId, createdBy: req.user.id });
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // Check if unit exists and belongs to user
        const unit = await Units.findOne({ _id: unitId, createdBy: req.user.id });
        if (!unit) {
            return res.status(404).json({ error: "Unit not found" });
        }

        // Generate contract content
        const title = `Storage Rental Agreement - ${client.name} - ${unit.type}`;

        const content = generateContractContent({
            clientName: client.name,
            unitName: unit.type,
            monthlyRate,
            startDate,
            endDate,
            clientEmail: client.email,
            clientPhone: client.phone
        });

        // Create draft contract
        const draftContract = new Contracts({
            clientId,
            unitId,
            monthlyRate,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            title,
            content,
            draft: true,
            createdBy: req.user.id
        });

        const savedContract = await draftContract.save();

        // Populate the saved contract with client and unit data
        const populatedContract = await Contracts.findById(savedContract._id)
            .populate('clientId', 'name email phone')
            .populate('unitId', 'name monthlyRate');

        res.json(populatedContract);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ error: errorMessage });
    }
});

// Finalize contract (mark as not draft)
router.patch("/:id/finalize", async (req, res) => {
    try {
        const contract = await Contracts.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.id },
            { draft: false },
            { new: true }
        ).populate('clientId', 'name')
            .populate('unitId', 'name');

        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }

        res.json(contract);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ error: errorMessage });
    }
});

// Delete contract
router.delete("/:id", async (req, res) => {
    try {
        const contract = await Contracts.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!contract) {
            return res.status(404).json({ error: "Contract not found" });
        }

        res.status(204).send();
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ error: errorMessage });
    }
});

// Helper function to generate contract content
function generateContractContent({ clientName, unitName, monthlyRate, startDate, endDate, clientEmail, clientPhone }: any) {
    const start = new Date(startDate).toLocaleDateString();
    const end = endDate ? new Date(endDate).toLocaleDateString() : 'Until terminated by either party';

    return `
STORAGE UNIT RENTAL AGREEMENT

This Storage Unit Rental Agreement ("Agreement") is made and effective as of ${start}, by and between:

Storage Facility Owner: [Your Company Name]
Address: [Your Address]
Phone: [Your Phone Number]

AND

Client: ${clientName}
Email: ${clientEmail || 'Not provided'}
Phone: ${clientPhone || 'Not provided'}

1. UNIT DESCRIPTION
The Owner agrees to rent to the Client the following storage unit:
- Unit: ${unitName}
- Monthly Rental Rate: $${monthlyRate.toFixed(2)}

2. TERM
This Agreement shall commence on ${start} and continue ${endDate ? `until ${end}` : 'month-to-month'}.

3. PAYMENT
Client shall pay the monthly rental fee of $${monthlyRate.toFixed(2)} in advance on the first day of each month.

4. USE OF UNIT
The storage unit shall be used solely for storage purposes. No illegal or hazardous materials may be stored.

5. ACCESS
Client shall have access to the storage unit during facility hours: [Specify hours].

6. DEFAULT
If Client fails to pay rent within 15 days of due date, Owner may terminate this Agreement and deny access.

7. TERMINATION
Either party may terminate this Agreement with 30 days written notice.

8. LIMITATION OF LIABILITY
Owner's liability for loss or damage is limited to [Specify amount or terms].

9. ENTIRE AGREEMENT
This Agreement constitutes the entire understanding between the parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

_________________________
[Your Company Name]

_________________________
${clientName}
  `.trim();
}

export default router;