"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalance } from "@/hooks/use-account-balance"

export function DepositForm() {
  const { toast } = useToast()
  const { balance, updateBalance, addTransaction } = useAccountBalance()
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setAmount(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const depositAmount = Number.parseFloat(amount)

    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Add transaction first
      await addTransaction({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: "Deposit",
        symbol: "INR",
        name: "Deposit to Account",
        shares: 0,
        price: 0,
        amount: depositAmount,
      })

      // Update balance
      const newBalance = balance + depositAmount
      console.log("Deposit: current balance =", balance, "deposit amount =", depositAmount, "new balance =", newBalance)
      await updateBalance(newBalance)

      toast({
        title: "Deposit successful",
        description: `₹${depositAmount.toFixed(2)} has been added to your account.`,
      })

      // Reset form
      setAmount("")
    } catch (error) {
      console.error("Error processing deposit:", error)
      toast({
        title: "Deposit failed",
        description: "There was an error processing your deposit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>Add money to your trading account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                <Input id="amount" placeholder="0.00" className="pl-8" value={amount} onChange={handleAmountChange} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Current Balance: <span className="font-medium">₹{balance.toFixed(2)}</span>
              </p>
              {amount && !isNaN(Number.parseFloat(amount)) && (
                <p className="text-sm text-muted-foreground mt-1">
                  New Balance: <span className="font-medium">₹{(balance + Number.parseFloat(amount)).toFixed(2)}</span>
                </p>
              )}
            </div>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Deposit Funds"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Note: This is a simulated deposit for educational purposes. No real money is involved.
        </p>
      </CardFooter>
    </Card>
  )
}
