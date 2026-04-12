const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, profile_image, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, email, password, phone, role = 'volunteer' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, role]
    );
    return result.insertId;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll({ role, search } = {}) {
    let query = `
      SELECT id, name, email, phone, role, profile_image, is_active, email_verified_at, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'organizer' THEN 1 ELSE 0 END) as organizers,
        SUM(CASE WHEN role = 'volunteer' THEN 1 ELSE 0 END) as volunteers,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
      FROM users
    `);

    return rows[0];
  }

  static async createByAdmin({ name, email, password, phone, role }) {
    return this.create({ name, email, password, phone, role });
  }

  static async updateRole(id, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return this.findById(id);
  }

  static async updateStatus(id, isActive) {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
    return this.findById(id);
  }

  static async update(id, { name, email, phone, role, is_active }) {
    await pool.query(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, role = ?, is_active = ?
       WHERE id = ?`,
      [name, email, phone || null, role, is_active, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = UserModel;
