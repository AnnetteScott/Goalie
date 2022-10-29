export interface UserData {
    saved: number,
    goals: {
        [key: string]: {
            name: string,
            amount: number,
            saved: number
        }
    }
}