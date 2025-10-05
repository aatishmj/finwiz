"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAccountBalance } from "@/hooks/use-account-balance"
import { UserService } from "@/services/user-service"

interface TradingPanelProps {
  symbol: string
  currentPrice: number
  defaultTab?: "buy" | "sell"
  maxShares?: number
  onTradeComplete?: () => void
}

export function TradingPanel({
  symbol,
  currentPrice,
  defaultTab = "buy",
  maxShares,
  onTradeComplete,
}: TradingPanelProps) {
  const { toast } = useToast()
  const { balance, updateBalance, addTransaction, isLoading } = useAccountBalance()
  const [shares, setShares] = useState("")
  const [orderType, setOrderType] = useState("market")
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2))
  const [tab, setTab] = useState(defaultTab)
  const [insufficientFunds, setInsufficientFunds] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setShares(value)
  }

  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setLimitPrice(value)
  }

  const estimatedTotal = shares ? Number.parseFloat(shares) * currentPrice : 0

  // Check if user has enough funds when buying
  useEffect(() => {
    if (tab === "buy" && estimatedTotal > 0) {
      setInsufficientFunds(estimatedTotal > balance)
    } else {
      setInsufficientFunds(false)
    }
  }, [tab, estimatedTotal, balance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shares || Number.parseFloat(shares) <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid number of shares",
        variant: "destructive",
      })
      return
    }

    if (orderType === "limit" && (!limitPrice || Number.parseFloat(limitPrice) <= 0)) {
      toast({
        title: "Invalid limit price",
        description: "Please enter a valid limit price",
        variant: "destructive",
      })
      return
    }

    const sharesAmount = Number.parseFloat(shares)
    const totalAmount = sharesAmount * currentPrice

    if (tab === "buy") {
      // Check if user has enough funds
      if (totalAmount > balance) {
        toast({
          title: "Insufficient funds",
          description: "You don't have enough funds to complete this purchase",
          variant: "destructive",
        })
        return
      }

      try {
        setIsSubmitting(true)

        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        // Execute trade via backend API
        await UserService.executeTrade(accessToken, symbol, "buy", sharesAmount, currentPrice)

        toast({
          title: "Order completed",
          description: `Successfully bought ${shares} shares of ${symbol} for ₹${totalAmount.toFixed(2)}`,
        })

        // Call onTradeComplete if provided
        if (onTradeComplete) {
          onTradeComplete()
        }
      } catch (error) {
        console.error("Error executing buy order:", error)
        toast({
          title: "Order failed",
          description: error instanceof Error ? error.message : "Failed to execute buy order. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
        setShares("")
      }
    } else {
      // Check if user is trying to sell more shares than they own
      if (maxShares !== undefined && sharesAmount > maxShares) {
        toast({
          title: "Invalid quantity",
          description: `You only have ${maxShares} shares of ${symbol} to sell`,
          variant: "destructive",
        })
        return
      }

      try {
        setIsSubmitting(true)

        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          throw new Error("No access token found")
        }

        // Execute trade via backend API
        await UserService.executeTrade(accessToken, symbol, "sell", sharesAmount, currentPrice)

        toast({
          title: "Order completed",
          description: `Successfully sold ${shares} shares of ${symbol} for ₹${totalAmount.toFixed(2)}`,
        })

        // Call onTradeComplete if provided
        if (onTradeComplete) {
          onTradeComplete()
        }
      } catch (error) {
        console.error("Error executing sell order:", error)
        toast({
          title: "Order failed",
          description: error instanceof Error ? error.message : "Failed to execute sell order. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
        setShares("")
      }
    }
  }

  return (
    <div className="mt-4">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">
            <ArrowDown className="mr-2 h-4 w-4 text-green-500" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell">
            <ArrowUp className="mr-2 h-4 w-4 text-red-500" />
            Sell
          </TabsTrigger>
        </TabsList>
        <form onSubmit={handleSubmit}>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-type">Order Type</Label>
              <RadioGroup
                id="order-type"
                value={orderType}
                onValueChange={setOrderType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="market" id="market" />
                  <Label htmlFor="market" className="font-normal">
                    Market Order
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limit" id="limit" />
                  <Label htmlFor="limit" className="font-normal">
                    Limit Order
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {orderType === "limit" && (
              <div className="space-y-2">
                <Label htmlFor="limit-price">Limit Price (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <Input
                    id="limit-price"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={handleLimitPriceChange}
                    className="pl-8"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input id="shares" placeholder="0" value={shares} onChange={handleSharesChange} />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-sm">Estimated Total:</span>
                <span className="font-medium">₹{estimatedTotal.toFixed(2)}</span>
              </div>
              {tab === "buy" && (
                <div className="mt-2 text-xs text-muted-foreground">
                  You are about to place an order to buy {shares || "0"} shares of {symbol}.
                  {insufficientFunds && (
                    <p className="mt-1 text-red-500">Warning: Insufficient funds for this transaction.</p>
                  )}
                </div>
              )}
              {tab === "sell" && (
                <div className="mt-2 text-xs text-muted-foreground">
                  You are about to place an order to sell {shares || "0"} shares of {symbol}.
                </div>
              )}
              {tab === "sell" && maxShares !== undefined && (
                <div className="text-xs text-muted-foreground mt-2">You have {maxShares} shares available to sell.</div>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-sm">Available Balance:</span>
                <span className="font-medium">₹{isLoading ? "Loading..." : balance.toFixed(2)}</span>
              </div>
              {tab === "buy" && (
                <div className="flex justify-between mt-2">
                  <span className="text-sm">Balance After Transaction:</span>
                  <span className={`font-medium ${insufficientFunds ? "text-red-500" : ""}`}>
                    ₹{isLoading ? "Loading..." : (balance - estimatedTotal).toFixed(2)}
                  </span>
                </div>
              )}
              {tab === "sell" && (
                <div className="flex justify-between mt-2">
                  <span className="text-sm">Balance After Transaction:</span>
                  <span className="font-medium">
                    ₹{isLoading ? "Loading..." : (balance + estimatedTotal).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="mt-4 w-full"
            disabled={isLoading || insufficientFunds || !shares || Number.parseFloat(shares) <= 0 || isSubmitting}
          >
            {isLoading ? "Processing..." : tab === "buy" ? "Buy" : "Sell"} {symbol}
          </Button>
        </form>
      </Tabs>
    </div>
  )
}
