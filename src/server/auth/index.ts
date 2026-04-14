import { getServerSession } from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

export const getServerAuthSession = () => getServerSession(authConfig);

export const auth = cache(getServerAuthSession);
