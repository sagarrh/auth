import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const authservice = new AuthService();
const authcontroller = new AuthController(authservice);

export {authservice,authcontroller};
