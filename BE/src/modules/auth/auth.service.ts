import { registerDTO } from "../../common/interfaces/auth.interface";

export class AuthService{
    public async register(regitserdata: registerDTO){
        const { name, email, password, userAgent}= regitserdata;
    }
}
