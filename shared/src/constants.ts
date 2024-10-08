import { Interval } from "./types";

export const INTERVAL_1M: Interval = {
    key: "1m",
    seconds: 60
}

export const INTERVAL_5M: Interval = {
    key: "5m",
    seconds: 60 * 5
}

export const INTERVAL_15M: Interval = {
    key: "15m",
    seconds: 60 * 15
}

export const INTERVAL_30M: Interval = {
    key: "30m",
    seconds: 60 * 30
}

export const INTERVAL_1H: Interval = {
    key: "1h",
    seconds: 60 * 60
}

export const INTERVAL_4H: Interval = {
    key: "4h",
    seconds: 60 * 60 * 4
}

export const INTERVAL_1D: Interval = {
    key: "1d",
    seconds: 60 * 60 * 24
}

export const GMX_USERS_QUERY = `
query PeriodAccountStats($from: Int, $to: Int) {
    all: periodAccountStats(
        limit: 100000
        where: {from: $from, to: $to}
    ) {
        id
        closedCount
        cumsumCollateral
        cumsumSize
        losses
        maxCapital
        realizedPriceImpact
        sumMaxSize
        netCapital
        realizedFees
        realizedPnl
        volume
        wins
        startUnrealizedPnl
        startUnrealizedFees
        startUnrealizedPriceImpact
        __typename
    }
}
`.trim();