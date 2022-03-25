export class Account {
    constructor(
        public _id: String,
        public username: String,
        public email: String,
        public role: String,
        public banned: Boolean,
        public created: Date,
        public deleted: boolean,
    ) {}
}
