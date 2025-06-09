import {z} from "zod"


const emailschema = z.string().trim().min(1).max(255);
const passwordschema = z.string().trim().min(6).max(255);


export const registerschema = z.object({
    name: z.string().trim().min(1).max(255),
    email : emailschema,
    password: passwordschema,
    confirmPassword: passwordschema,
    userAgent  : z.string().optional()
}).refine((val)=> val.password===val.confirmPassword,{
    message:"password do not match",
    path:["confirmPassword"]
});

export const login= z.object({
    email:emailschema,
    password: passwordschema
})
