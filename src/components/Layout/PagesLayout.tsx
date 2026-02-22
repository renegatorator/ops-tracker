import classes from "./PagesLayout.module.scss";

type PagesLayoutProps = {
  children: React.ReactNode;
};

export default function PagesLayout({ children }: PagesLayoutProps) {
  return <div className={classes.pagesLayout}>{children}</div>;
}
