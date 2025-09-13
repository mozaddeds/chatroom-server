// src/auth/auth.controller.ts
import { Controller, Post, Body, Res, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const result = await this.authService.login(user);

    // Store user ID in session
    req.session.userId = user.id;

    return res.json(result);
  }

  @Post('logout')
  async logout(@Req() req: express.Request, @Res() res: express.Response) {
    const userId = req.session.userId;
    if (userId) {
      await this.authService.logout(userId);
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
    }
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  async getCurrentUser(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await this.authService.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
}
