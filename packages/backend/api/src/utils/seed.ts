import { User } from '../models/user.model.js';

export async function initSeedData(): Promise<void> {
    const user = await User.findOne({ email: 'admin@example.com' });
    if (!user) {
        await User.create({
            email: 'admin@example.com',
            passwordHash: 'password',
            name: 'Admin',
        });
    }



    console.log('✅ Seed data initialized');
}