const express = require('express');
const app = express();

app.use(express.json());

// CORS simple
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Routes
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'OK' });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    if (email === 'admin@konipa.com' && password === 'admin123') {
        res.json({
            success: true,
            token: 'mock-token-123',
            user: {
                id: 'b3543451-c085-43d1-9ce1-2d1ad32bf620',
                email: 'admin@konipa.com',
                role: 'admin',
                name: 'Admin Konipa'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Identifiants invalides'
        });
    }
});

app.get('/api/pricing', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                client: { company_name: 'ELYAZID PIECES AUTO', contact_person: 'Ahmed Elyazid' },
                product: { name: 'Plaquettes de frein avant', base_price_ht: 125.50 },
                discount_percent: 5.00,
                minimum_quantity: 10,
                is_active: true
            }
        ]
    });
});

app.get('/api/clients', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                company_name: 'ELYAZID PIECES AUTO',
                contact_person: 'Ahmed Elyazid',
                email: 'contact@elyazid-pieces.com'
            }
        ]
    });
});

app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                name: 'Plaquettes de frein avant',
                base_price_ht: 125.50,
                brand: 'Brembo'
            }
        ]
    });
});

app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: '1',
                email: 'admin@konipa.com',
                role: 'admin',
                name: 'Admin Konipa'
            }
        ]
    });
});

const PORT = 3003;
console.log('Starting server...');
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

