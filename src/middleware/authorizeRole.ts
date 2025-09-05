import { Request, Response, NextFunction } from "express";

export function authorizeRole(roles: string[]) {
    return (req: any, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: insufficient role" });
        }
        next();
    };
}
