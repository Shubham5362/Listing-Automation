export type BridgeMarketplace="amazon"|"flipkart";
export type BridgeField={name?:string;id?:string;autocomplete?:string;label?:string;canonical?:string;field?:string};
export type BridgeCommand={sequence:number;action_id:number;field:string;selector_strategy:string;selector:string;value:unknown};
