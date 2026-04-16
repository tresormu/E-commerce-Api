"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFromUSD = convertFromUSD;
const axios_1 = __importDefault(require("axios"));
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cache = null;
async function getRates() {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
        return { EUR: cache.EUR, RWF: cache.RWF };
    }
    try {
        // Frankfurter base is EUR by default — fetch USD base so we get USD→EUR and USD→RWF
        const { data } = await axios_1.default.get(`${FRANKFURTER_URL}?from=USD&to=EUR,RWF`, { timeout: 5000 });
        cache = {
            EUR: data.rates.EUR,
            RWF: data.rates.RWF,
            fetchedAt: now,
        };
        return { EUR: cache.EUR, RWF: cache.RWF };
    }
    catch (error) {
        console.error("Currency API Error, using fallbacks:", error);
        // Return last successful cache if available, otherwise hardcoded fallbacks
        if (cache)
            return { EUR: cache.EUR, RWF: cache.RWF };
        return {
            EUR: 0.92, // Approximate fallback
            RWF: 1280, // Approximate fallback
        };
    }
}
async function convertFromUSD(priceUSD) {
    const { EUR, RWF } = await getRates();
    return {
        priceUSD: parseFloat(priceUSD.toFixed(2)),
        priceEUR: parseFloat((priceUSD * EUR).toFixed(2)),
        priceRWF: parseFloat((priceUSD * RWF).toFixed(0)),
    };
}
