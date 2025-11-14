import { get, put } from "../apiClient/apiClient";

export type profile = {
    name: string;
    email: string;
    bio?: string;
    banner?: object | { url: string; alt: string };
    avatar?: object | { url: string; alt: string };
    credits: number;
    _count: object | { listings: number, wins: number;};
}
