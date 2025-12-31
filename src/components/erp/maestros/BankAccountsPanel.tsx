/**
 * Panel de gestión de Cuentas Bancarias y Mandatos SEPA
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  CreditCard,
  FileSignature,
  Building2,
  Users,
  Truck
} from 'lucide-react';
import { useMaestros } from '@/hooks/erp/useMaestros';

export const BankAccountsPanel: React.FC = () => {
  const { bankAccounts, bankAccountsLoading, sepaMandates, sepaMandatesLoading } = useMaestros();

  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  const getOwnerIcon = (type: string) => {
    switch (type) {
      case 'company': return <Building2 className="h-4 w-4" />;
      case 'customer': return <Users className="h-4 w-4" />;
      case 'supplier': return <Truck className="h-4 w-4" />;
      default: return null;
    }
  };

  const getOwnerLabel = (type: string) => {
    switch (type) {
      case 'company': return 'Empresa';
      case 'customer': return 'Cliente';
      case 'supplier': return 'Proveedor';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Bancos y Mandatos SEPA
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cuentas Bancarias
            </TabsTrigger>
            <TabsTrigger value="mandates" className="gap-2">
              <FileSignature className="h-4 w-4" />
              Mandatos SEPA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            {bankAccountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay cuentas bancarias registradas</p>
                <p className="text-sm mt-2">
                  Las cuentas se crean desde la ficha de cliente/proveedor
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titular</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>BIC</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getOwnerIcon(account.owner_type)}
                            {getOwnerLabel(account.owner_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatIBAN(account.iban)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.bic || '-'}
                        </TableCell>
                        <TableCell>{account.bank_name || '-'}</TableCell>
                        <TableCell>
                          {account.is_default && (
                            <Badge variant="secondary">Sí</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="mandates">
            {sepaMandatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : sepaMandates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay mandatos SEPA registrados</p>
                <p className="text-sm mt-2">
                  Los mandatos se crean desde la ficha del cliente
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha Firma</TableHead>
                      <TableHead>Esquema</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sepaMandates.map((mandate: any) => (
                      <TableRow key={mandate.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {mandate.mandate_ref}
                        </TableCell>
                        <TableCell>{mandate.customers?.legal_name || '-'}</TableCell>
                        <TableCell>
                          {new Date(mandate.signed_date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{mandate.scheme}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mandate.is_active ? 'default' : 'secondary'}>
                            {mandate.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BankAccountsPanel;
